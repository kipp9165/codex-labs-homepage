import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireEnv, normalizeString, safeNumber } from "./_shared/api_helpers.js";
import { fetchStripeCollection, amountFromMinorUnits } from "./_shared/stripe_helpers.js";
import { fetchAllBaserowRows, buildBaserowSkuMap } from "./_shared/baserow_helpers.js";
import { fetchOpenIssueTitles, createIssueWithDedupe } from "./_shared/github_issues.js";
import { fileTimestamp, isoDateFromUnix, timestampIso, unixDaysAgo, unixNow } from "./_shared/time_utils.js";
import { createLogger } from "./_shared/logging.js";

const logger = createLogger("revenue_dashboard");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const revenueDir = path.join(repoRoot, "analytics", "revenue");
const historyDir = path.join(revenueDir, "revenue_history");
const latestPath = path.join(revenueDir, "revenue_latest.json");

function mapById(items) {
  const map = new Map();
  for (const item of items) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return map;
}

function groupRevenue(rows, keyFn) {
  const map = new Map();
  for (const row of rows) {
    const key = keyFn(row);
    if (!map.has(key)) {
      map.set(key, { revenue: 0, count: 0 });
    }
    const bucket = map.get(key);
    bucket.revenue = Number((bucket.revenue + row.amount).toFixed(2));
    bucket.count += 1;
  }
  return map;
}

function normalizeRows(charges, intents, baserowMap) {
  const intentById = mapById(intents);
  const rows = [];

  for (const charge of charges) {
    if (!charge || !charge.paid || charge.refunded) {
      continue;
    }

    const intentId = typeof charge.payment_intent === "string" ? charge.payment_intent : "";
    const intent = intentById.get(intentId);

    const productId = normalizeString((charge.metadata && charge.metadata.product_id) || (intent && intent.metadata && intent.metadata.product_id));
    const priceId = normalizeString((charge.metadata && charge.metadata.price_id) || (intent && intent.metadata && intent.metadata.price_id));
    if (!productId || !priceId) {
      continue;
    }

    const currency = normalizeString(charge.currency || (intent && intent.currency)).toLowerCase();
    const created = safeNumber(charge.created || (intent && intent.created), 0);
    const key = `${productId}::${priceId}`;
    const meta = baserowMap.get(key);

    rows.push({
      charge_id: normalizeString(charge.id),
      payment_intent_id: intentId,
      product_id: productId,
      price_id: priceId,
      product_name: normalizeString(meta && (meta.product_name || meta.name)),
      amount: amountFromMinorUnits(safeNumber(charge.amount), currency),
      currency,
      created,
      created_date: isoDateFromUnix(created),
      active: meta ? meta.active !== false : null,
    });
  }

  return rows;
}

function buildAggregates(rows) {
  const skuMap = groupRevenue(rows, (row) => `${row.product_id}::${row.price_id}`);
  const productMap = groupRevenue(rows, (row) => row.product_id);
  const priceMap = groupRevenue(rows, (row) => row.price_id);
  const dailyMap = groupRevenue(rows, (row) => row.created_date);

  const revenuePerSku = Array.from(skuMap.entries()).map(([key, value]) => {
    const [productId, priceId] = key.split("::");
    const seed = rows.find((row) => row.product_id === productId && row.price_id === priceId);
    return {
      product_id: productId,
      price_id: priceId,
      product_name: seed ? seed.product_name : "",
      revenue: value.revenue,
      count: value.count,
    };
  }).sort((a, b) => b.revenue - a.revenue);

  const revenuePerProductId = Array.from(productMap.entries()).map(([productId, value]) => ({
    product_id: productId,
    revenue: value.revenue,
    count: value.count,
  })).sort((a, b) => b.revenue - a.revenue);

  const revenuePerPriceId = Array.from(priceMap.entries()).map(([priceId, value]) => ({
    price_id: priceId,
    revenue: value.revenue,
    count: value.count,
  })).sort((a, b) => b.revenue - a.revenue);

  const dailyRevenue = Array.from(dailyMap.entries()).map(([date, value]) => ({
    date,
    revenue: value.revenue,
    count: value.count,
  })).sort((a, b) => a.date.localeCompare(b.date));

  const weeklyRevenue = Number(rows
    .filter((row) => row.created >= unixDaysAgo(7))
    .reduce((sum, row) => sum + row.amount, 0)
    .toFixed(2));

  return {
    revenue_per_sku: revenuePerSku,
    revenue_per_product_id: revenuePerProductId,
    revenue_per_price_id: revenuePerPriceId,
    daily_revenue: dailyRevenue,
    weekly_revenue: weeklyRevenue,
    top_skus: revenuePerSku.slice(0, 10),
  };
}

function detectAnomalies(rows, aggregates, baserowMap) {
  const anomalies = [];

  const currentFrom = unixDaysAgo(1);
  const baselineFrom = unixDaysAgo(8);
  const baselineTo = currentFrom;

  const currentRevenue = rows.filter((row) => row.created >= currentFrom).reduce((sum, row) => sum + row.amount, 0);
  const baselineRevenue = rows.filter((row) => row.created >= baselineFrom && row.created < baselineTo).reduce((sum, row) => sum + row.amount, 0) / 7;

  if (baselineRevenue > 0 && currentRevenue < baselineRevenue * 0.6) {
    anomalies.push({
      type: "sudden_revenue_drop",
      scope: "site",
      expected_daily_average: Number(baselineRevenue.toFixed(2)),
      actual_last_24h: Number(currentRevenue.toFixed(2)),
    });
  }

  const currentSku = groupRevenue(rows.filter((row) => row.created >= currentFrom), (row) => `${row.product_id}::${row.price_id}`);
  const baselineSku = groupRevenue(rows.filter((row) => row.created >= baselineFrom && row.created < baselineTo), (row) => `${row.product_id}::${row.price_id}`);

  for (const [key, baseline] of baselineSku.entries()) {
    const current = currentSku.get(key) || { revenue: 0 };
    const baselineDaily = baseline.revenue / 7;
    if (baselineDaily > 0 && current.revenue < baselineDaily * 0.4) {
      const [productId, priceId] = key.split("::");
      anomalies.push({
        type: "sku_level_collapse",
        scope: "sku",
        product_id: productId,
        price_id: priceId,
        expected_daily_average: Number(baselineDaily.toFixed(2)),
        actual_last_24h: Number(current.revenue.toFixed(2)),
      });
    }
  }

  for (const [key, sku] of baserowMap.entries()) {
    if (sku.active === false) {
      continue;
    }
    const revenue = currentSku.get(key);
    if (!revenue || revenue.revenue <= 0) {
      anomalies.push({
        type: "zero_revenue_active_funnel",
        scope: "sku",
        product_id: sku.product_id,
        price_id: sku.price_id,
        expected: "revenue > 0",
        actual: 0,
      });
    }
  }

  const underperformingSkus = aggregates.revenue_per_sku.filter((row) => row.revenue === 0);
  return { anomalies, underperforming_skus: underperformingSkus };
}

function issueTitle(anomaly) {
  if (anomaly.scope === "sku") {
    return `Revenue Anomaly: ${anomaly.type} ${anomaly.product_id}/${anomaly.price_id}`;
  }
  return `Revenue Anomaly: ${anomaly.type}`;
}

function issueBody(anomaly) {
  return [
    "Revenue anomaly detected by nightly dashboard.",
    "",
    "```json",
    JSON.stringify(anomaly, null, 2),
    "```",
  ].join("\n");
}

async function writeReport(report) {
  await mkdir(historyDir, { recursive: true });
  const serialized = `${JSON.stringify(report, null, 2)}\n`;
  await writeFile(latestPath, serialized, "utf8");
  await writeFile(path.join(historyDir, `${fileTimestamp()}.json`), serialized, "utf8");
}

async function main() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const baserowApiToken = process.env.BASEROW_API_TOKEN;
  const baserowTableId = process.env.BASEROW_TABLE_ID;
  const baserowApiBase = process.env.BASEROW_API_BASE || "https://api.baserow.io";
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  requireEnv("STRIPE_SECRET_KEY", stripeSecretKey);
  requireEnv("BASEROW_API_TOKEN", baserowApiToken);
  requireEnv("BASEROW_TABLE_ID", baserowTableId);

  const createdFilter = { "created[gte]": unixDaysAgo(35) };

  const [charges, intents, baserowRows] = await Promise.all([
    fetchStripeCollection(stripeSecretKey, "charges", createdFilter),
    fetchStripeCollection(stripeSecretKey, "payment_intents", createdFilter),
    fetchAllBaserowRows({ apiToken: baserowApiToken, tableId: baserowTableId, apiBase: baserowApiBase }),
  ]);

  const baserowMap = buildBaserowSkuMap(baserowRows);
  const normalizedRows = normalizeRows(charges, intents, baserowMap);
  const aggregates = buildAggregates(normalizedRows);
  const { anomalies, underperforming_skus } = detectAnomalies(normalizedRows, aggregates, baserowMap);

  const report = {
    generated_at: timestampIso(),
    totals: {
      charge_count: normalizedRows.length,
      total_revenue: Number(normalizedRows.reduce((sum, row) => sum + row.amount, 0).toFixed(2)),
      from_unix: unixDaysAgo(35),
      to_unix: unixNow(),
    },
    revenue_per_sku: aggregates.revenue_per_sku,
    revenue_per_product_id: aggregates.revenue_per_product_id,
    revenue_per_price_id: aggregates.revenue_per_price_id,
    daily_revenue: aggregates.daily_revenue,
    weekly_revenue: aggregates.weekly_revenue,
    top_skus: aggregates.top_skus,
    underperforming_skus,
    anomalies,
  };

  await writeReport(report);

  let issuesCreatedCount = 0;
  if (githubToken && githubRepo && anomalies.length) {
    const openTitles = await fetchOpenIssueTitles({ token: githubToken, repo: githubRepo });
    for (const anomaly of anomalies) {
      const created = await createIssueWithDedupe({
        token: githubToken,
        repo: githubRepo,
        title: issueTitle(anomaly),
        body: issueBody(anomaly),
        labels: ["automation", "analytics", "revenue"],
        openTitles,
      });
      if (created) {
        issuesCreatedCount += 1;
      }
    }
  }

  logger.summary({
    job: "revenue_dashboard",
    issues_created_count: issuesCreatedCount,
    anomaly_count: anomalies.length,
    weekly_revenue: report.weekly_revenue,
    top_skus_count: report.top_skus.length,
  });
}

main().catch((error) => {
  logger.error("fatal", { error: error.message });
  process.exit(1);
});
