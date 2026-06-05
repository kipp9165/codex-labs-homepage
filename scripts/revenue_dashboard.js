import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const BASEROW_API_TOKEN = process.env.BASEROW_API_TOKEN;
const BASEROW_TABLE_ID = process.env.BASEROW_TABLE_ID;
const BASEROW_API_BASE = process.env.BASEROW_API_BASE || "https://api.baserow.io";
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

const DROP_THRESHOLD = 0.5;
const SKU_DROP_THRESHOLD = 0.35;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const revenueDir = path.join(repoRoot, "analytics", "revenue");
const historyDir = path.join(revenueDir, "revenue_history");
const latestPath = path.join(revenueDir, "revenue_latest.json");

function requireEnv(name, value) {
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function safeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}

function toIsoDate(unixSeconds) {
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

function usdAmount(cents) {
  return Number((safeNumber(cents) / 100).toFixed(2));
}

function mapById(items) {
  const map = new Map();
  for (const item of items) {
    if (item && item.id) {
      map.set(item.id, item);
    }
  }
  return map;
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data && data.error && data.error.message
      ? data.error.message
      : data && data.message
        ? data.message
        : `Request failed (${response.status})`;
    throw new Error(`${message} :: ${url}`);
  }

  return data;
}

async function fetchStripeCollection(resourcePath, extraParams = {}) {
  const items = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = new URLSearchParams({ limit: "100", ...extraParams });
    if (startingAfter) {
      params.set("starting_after", startingAfter);
    }

    const payload = await fetchJson(`https://api.stripe.com/v1/${resourcePath}?${params.toString()}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });

    const pageItems = Array.isArray(payload.data) ? payload.data : [];
    items.push(...pageItems);
    hasMore = Boolean(payload.has_more);
    startingAfter = hasMore && pageItems.length ? pageItems[pageItems.length - 1].id : null;
  }

  return items;
}

async function fetchBaserowRows() {
  if (!BASEROW_API_TOKEN || !BASEROW_TABLE_ID) {
    return [];
  }

  const rows = [];
  let next = `${BASEROW_API_BASE}/api/database/rows/table/${BASEROW_TABLE_ID}/?user_field_names=true&size=200&page=1`;

  while (next) {
    const payload = await fetchJson(next, {
      method: "GET",
      headers: {
        Authorization: `Token ${BASEROW_API_TOKEN}`,
      },
    });

    rows.push(...(Array.isArray(payload.results) ? payload.results : []));
    next = payload.next || null;
  }

  return rows;
}

function buildMetadataMap(rows) {
  const metadata = new Map();

  for (const row of rows) {
    const productId = normalizeString(row.product_id);
    const priceId = normalizeString(row.price_id);
    if (!productId || !priceId) {
      continue;
    }

    metadata.set(`${productId}::${priceId}`, {
      product_id: productId,
      price_id: priceId,
      product_name: normalizeString(row.product_name) || normalizeString(row.name),
      currency: normalizeString(row.currency).toLowerCase(),
      amount: typeof row.amount === "number" ? row.amount : null,
      active: row.active !== false,
    });
  }

  return metadata;
}

function normalizeRevenueRows(charges, paymentIntents, metadataMap) {
  const paymentIntentMap = mapById(paymentIntents);
  const rows = [];

  for (const charge of charges) {
    if (!charge || !charge.paid || charge.refunded) {
      continue;
    }

    const paymentIntentId = typeof charge.payment_intent === "string" ? charge.payment_intent : null;
    const paymentIntent = paymentIntentId ? paymentIntentMap.get(paymentIntentId) : null;

    let productId = normalizeString(charge.metadata && charge.metadata.product_id);
    let priceId = normalizeString(charge.metadata && charge.metadata.price_id);

    if (!productId && paymentIntent) {
      productId = normalizeString(paymentIntent.metadata && paymentIntent.metadata.product_id);
    }
    if (!priceId && paymentIntent) {
      priceId = normalizeString(paymentIntent.metadata && paymentIntent.metadata.price_id);
    }

    const key = productId && priceId ? `${productId}::${priceId}` : "";
    const meta = key ? metadataMap.get(key) : null;

    rows.push({
      charge_id: charge.id,
      payment_intent_id: paymentIntentId,
      product_id: productId || (meta ? meta.product_id : "unknown_product"),
      price_id: priceId || (meta ? meta.price_id : "unknown_price"),
      product_name: meta ? meta.product_name : "",
      amount: usdAmount(charge.amount),
      currency: normalizeString(charge.currency).toLowerCase(),
      created_unix: safeNumber(charge.created),
      created_date: toIsoDate(safeNumber(charge.created)),
    });
  }

  return rows;
}

function aggregateRevenue(rows) {
  const perSku = new Map();
  const perProduct = new Map();
  const perPrice = new Map();
  const daily = new Map();

  for (const row of rows) {
    const skuKey = `${row.product_id}::${row.price_id}`;

    if (!perSku.has(skuKey)) {
      perSku.set(skuKey, {
        product_id: row.product_id,
        price_id: row.price_id,
        product_name: row.product_name,
        currency: row.currency,
        revenue: 0,
        tx_count: 0,
      });
    }
    const sku = perSku.get(skuKey);
    sku.revenue = Number((sku.revenue + row.amount).toFixed(2));
    sku.tx_count += 1;

    if (!perProduct.has(row.product_id)) {
      perProduct.set(row.product_id, { product_id: row.product_id, revenue: 0, tx_count: 0 });
    }
    const product = perProduct.get(row.product_id);
    product.revenue = Number((product.revenue + row.amount).toFixed(2));
    product.tx_count += 1;

    if (!perPrice.has(row.price_id)) {
      perPrice.set(row.price_id, { price_id: row.price_id, revenue: 0, tx_count: 0 });
    }
    const price = perPrice.get(row.price_id);
    price.revenue = Number((price.revenue + row.amount).toFixed(2));
    price.tx_count += 1;

    if (!daily.has(row.created_date)) {
      daily.set(row.created_date, { date: row.created_date, revenue: 0, tx_count: 0 });
    }
    const day = daily.get(row.created_date);
    day.revenue = Number((day.revenue + row.amount).toFixed(2));
    day.tx_count += 1;
  }

  const dailySeries = Array.from(daily.values()).sort((a, b) => a.date.localeCompare(b.date));
  const weeklyRevenue = Number(
    dailySeries
      .slice(-7)
      .reduce((sum, row) => sum + row.revenue, 0)
      .toFixed(2)
  );

  const skuList = Array.from(perSku.values()).sort((a, b) => b.revenue - a.revenue);

  return {
    revenue_per_sku: skuList,
    revenue_per_product_id: Array.from(perProduct.values()).sort((a, b) => b.revenue - a.revenue),
    revenue_per_price_id: Array.from(perPrice.values()).sort((a, b) => b.revenue - a.revenue),
    daily_revenue: dailySeries,
    weekly_revenue: weeklyRevenue,
    top_skus: skuList.slice(0, 10),
  };
}

function detectAnomalies(rows, aggregates, metadataMap) {
  const anomalies = [];
  const daily = aggregates.daily_revenue;

  if (daily.length >= 8) {
    const today = daily[daily.length - 1].revenue;
    const baseline = daily.slice(-8, -1).reduce((sum, day) => sum + day.revenue, 0) / 7;

    if (baseline > 0 && today < baseline * DROP_THRESHOLD) {
      anomalies.push({
        type: "sudden_revenue_drop",
        expected: Number(baseline.toFixed(2)),
        actual: today,
        drop_percent: Number(((1 - today / baseline) * 100).toFixed(2)),
        suggested_fix: "Check Stripe checkout flow health, webhook processing, and payment link routing.",
      });
    }
  }

  const nowUnix = Math.floor(Date.now() / 1000);
  const currentFrom = nowUnix - 24 * 3600;
  const baselineFrom = nowUnix - 8 * 24 * 3600;
  const baselineTo = currentFrom;

  const skuDaily = new Map();
  for (const row of rows) {
    const key = `${row.product_id}::${row.price_id}`;
    if (!skuDaily.has(key)) {
      skuDaily.set(key, { today: 0, baselineDays: [] });
    }

    const entry = skuDaily.get(key);
    if (row.created_unix >= currentFrom) {
      entry.today = Number((entry.today + row.amount).toFixed(2));
    } else if (row.created_unix >= baselineFrom && row.created_unix < baselineTo) {
      entry.baselineDays.push(row.amount);
    }
  }

  for (const sku of aggregates.revenue_per_sku) {
    const key = `${sku.product_id}::${sku.price_id}`;
    const entry = skuDaily.get(key);
    const baseline = entry && entry.baselineDays.length
      ? entry.baselineDays.reduce((sum, value) => sum + value, 0) / 7
      : 0;

    if (baseline > 0 && entry.today < baseline * SKU_DROP_THRESHOLD) {
      anomalies.push({
        type: "sku_level_collapse",
        product_id: sku.product_id,
        price_id: sku.price_id,
        expected: Number(baseline.toFixed(2)),
        actual: Number(entry.today.toFixed(2)),
        suggested_fix: "Review this SKU payment link, checkout page, and campaign routing.",
      });
    }
  }

  const underperforming = [];
  for (const [key, meta] of metadataMap.entries()) {
    if (!meta.active) {
      continue;
    }

    const sku = aggregates.revenue_per_sku.find((item) => `${item.product_id}::${item.price_id}` === key);
    if (!sku || sku.revenue === 0) {
      underperforming.push({
        product_id: meta.product_id,
        price_id: meta.price_id,
        product_name: meta.product_name,
        reason: "zero_revenue_active_funnel",
      });

      anomalies.push({
        type: "zero_revenue_active_funnel",
        product_id: meta.product_id,
        price_id: meta.price_id,
        expected: "> 0",
        actual: 0,
        suggested_fix: "Investigate traffic and conversion path for active SKU with zero revenue.",
      });
    }
  }

  return { anomalies, underperforming_skus: underperforming };
}

function issueTitle(anomaly) {
  if (anomaly.type === "sudden_revenue_drop") {
    return "Revenue Anomaly: sudden revenue drop";
  }
  if (anomaly.type === "sku_level_collapse") {
    return `Revenue Anomaly: SKU collapse ${anomaly.product_id} ${anomaly.price_id}`;
  }
  return `Revenue Anomaly: zero revenue active SKU ${anomaly.product_id} ${anomaly.price_id}`;
}

function issueBody(anomaly, report) {
  return [
    `Type: ${anomaly.type}`,
    `Product ID: ${anomaly.product_id || "site-wide"}`,
    `Price ID: ${anomaly.price_id || "n/a"}`,
    `Expected: ${anomaly.expected ?? "n/a"}`,
    `Actual: ${anomaly.actual ?? "n/a"}`,
    `Suggested fix: ${anomaly.suggested_fix || "n/a"}`,
    "",
    "```json",
    JSON.stringify(
      {
        weekly_revenue: report.weekly_revenue,
        top_skus: report.top_skus.slice(0, 3),
      },
      null,
      2
    ),
    "```",
  ].join("\n");
}

async function fetchOpenIssueTitles() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return new Set();
  }

  const titles = new Set();

  for (let page = 1; page <= 10; page += 1) {
    const issues = await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/issues?state=open&per_page=100&page=${page}`, {
      method: "GET",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
    });

    if (!Array.isArray(issues) || issues.length === 0) {
      break;
    }

    for (const issue of issues) {
      if (issue && typeof issue.title === "string") {
        titles.add(issue.title);
      }
    }
  }

  return titles;
}

async function openIssues(anomalies, report) {
  if (!GITHUB_TOKEN || !GITHUB_REPO || anomalies.length === 0) {
    return 0;
  }

  const titles = await fetchOpenIssueTitles();
  let created = 0;

  for (const anomaly of anomalies) {
    const title = issueTitle(anomaly);
    if (titles.has(title)) {
      continue;
    }

    await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
      method: "POST",
      headers: {
        Authorization: `token ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "Content-Type": "application/json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        title,
        body: issueBody(anomaly, report),
      }),
    });

    titles.add(title);
    created += 1;
  }

  return created;
}

async function writeReport(report) {
  await mkdir(historyDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  await writeFile(latestPath, serialized, "utf8");
  await writeFile(path.join(historyDir, `${timestamp}.json`), serialized, "utf8");
}

async function main() {
  requireEnv("STRIPE_SECRET_KEY", STRIPE_SECRET_KEY);
  requireEnv("BASEROW_API_TOKEN", BASEROW_API_TOKEN);
  requireEnv("BASEROW_TABLE_ID", BASEROW_TABLE_ID);

  const [charges, paymentIntents, baserowRows] = await Promise.all([
    fetchStripeCollection("charges"),
    fetchStripeCollection("payment_intents"),
    fetchBaserowRows(),
  ]);

  const metadataMap = buildMetadataMap(baserowRows);
  const normalizedRows = normalizeRevenueRows(charges, paymentIntents, metadataMap);

  const aggregates = aggregateRevenue(normalizedRows);
  const { anomalies, underperforming_skus } = detectAnomalies(normalizedRows, aggregates, metadataMap);

  const report = {
    generated_at: new Date().toISOString(),
    totals: {
      charge_count: normalizedRows.length,
      total_revenue: Number(normalizedRows.reduce((sum, row) => sum + row.amount, 0).toFixed(2)),
    },
    normalized_rows_sample: normalizedRows.slice(0, 50),
    ...aggregates,
    underperforming_skus,
    anomalies,
  };

  await writeReport(report);
  const issuesCreatedCount = await openIssues(anomalies, report);

  console.log(
    JSON.stringify(
      {
        issues_created_count: issuesCreatedCount,
        anomaly_count: anomalies.length,
        weekly_revenue: report.weekly_revenue,
        top_skus_count: report.top_skus.length,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Revenue dashboard generation failed:", error.message);
  process.exit(1);
});
