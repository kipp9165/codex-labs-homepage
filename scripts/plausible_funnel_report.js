import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireEnv, normalizeString, safeNumber } from "./_shared/api_helpers.js";
import { queryPlausible } from "./_shared/plausible_helpers.js";
import { fetchOpenIssueTitles, createIssueWithDedupe } from "./_shared/github_issues.js";
import { fileTimestamp, timestampIso } from "./_shared/time_utils.js";
import { createLogger } from "./_shared/logging.js";

const logger = createLogger("plausible_funnel_report");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const funnelDir = path.join(repoRoot, "analytics", "funnel");
const historyDir = path.join(funnelDir, "funnel_history");
const latestPath = path.join(funnelDir, "funnel_latest.json");

const TRACKED_GOALS = ["cta_click", "checkout_redirect", "checkout_success"];

function ratio(numerator, denominator) {
  if (!denominator) {
    return null;
  }
  return Number((numerator / denominator).toFixed(4));
}

async function fetchMetric(apiKey, siteId, dateRange, metric) {
  const payload = await queryPlausible({
    apiKey,
    siteId,
    query: {
      date_range: dateRange,
      metrics: [metric],
    },
  });

  const row = Array.isArray(payload.results) && payload.results[0] ? payload.results[0] : null;
  return row ? safeNumber(row.metrics && row.metrics[0]) : 0;
}

async function fetchGoals(apiKey, siteId, dateRange) {
  const payload = await queryPlausible({
    apiKey,
    siteId,
    query: {
      date_range: dateRange,
      metrics: ["events"],
      dimensions: ["event:goal", "event:props:product_id", "event:props:price_id"],
      filters: [["is", "event:goal", TRACKED_GOALS]],
    },
  });

  return Array.isArray(payload.results) ? payload.results : [];
}

function goalsTotals(rows) {
  const totals = { cta_click: 0, checkout_redirect: 0, checkout_success: 0 };
  for (const row of rows) {
    const goal = normalizeString(row.dimensions && row.dimensions[0]);
    if (!TRACKED_GOALS.includes(goal)) {
      continue;
    }
    totals[goal] += safeNumber(row.metrics && row.metrics[0]);
  }
  return totals;
}

function skuBreakdown(rows) {
  const map = new Map();
  for (const row of rows) {
    const goal = normalizeString(row.dimensions && row.dimensions[0]);
    const productId = normalizeString(row.dimensions && row.dimensions[1]);
    const priceId = normalizeString(row.dimensions && row.dimensions[2]);
    if (!goal || !productId || !priceId || !TRACKED_GOALS.includes(goal)) {
      continue;
    }

    const key = `${productId}::${priceId}`;
    if (!map.has(key)) {
      map.set(key, {
        product_id: productId,
        price_id: priceId,
        cta_clicks: 0,
        checkout_redirects: 0,
        checkout_successes: 0,
      });
    }

    const entry = map.get(key);
    const value = safeNumber(row.metrics && row.metrics[0]);
    if (goal === "cta_click") {
      entry.cta_clicks += value;
    }
    if (goal === "checkout_redirect") {
      entry.checkout_redirects += value;
    }
    if (goal === "checkout_success") {
      entry.checkout_successes += value;
    }
  }

  return Array.from(map.values()).map((entry) => ({
    ...entry,
    redirect_rate: ratio(entry.checkout_redirects, entry.cta_clicks),
    success_rate: ratio(entry.checkout_successes, entry.checkout_redirects),
  }));
}

function detectAnomalies(report) {
  const anomalies = [];

  const baseline = report.baseline_7d;
  if (baseline.cta_clicks > 0 && report.cta_clicks < baseline.cta_clicks / 7 * 0.7) {
    anomalies.push({
      type: "cta_drop",
      scope: "site",
      expected: Number((baseline.cta_clicks / 7).toFixed(2)),
      actual: report.cta_clicks,
      suggested_fix: "Check buy-button click tracking and page-level CTA visibility.",
    });
  }

  if (baseline.redirect_rate > 0 && (report.redirect_rate ?? 0) < baseline.redirect_rate * 0.75) {
    anomalies.push({
      type: "redirect_rate_drop",
      scope: "site",
      expected: baseline.redirect_rate,
      actual: report.redirect_rate,
      suggested_fix: "Check checkout redirect event firing and outbound navigation behavior.",
    });
  }

  if (baseline.success_rate > 0 && (report.success_rate ?? 0) < baseline.success_rate * 0.75) {
    anomalies.push({
      type: "success_rate_drop",
      scope: "site",
      expected: baseline.success_rate,
      actual: report.success_rate,
      suggested_fix: "Check webhook-driven checkout_success event emission.",
    });
  }

  return anomalies;
}

function issueTitle(anomaly) {
  return `Funnel Anomaly: ${anomaly.type}`;
}

function issueBody(anomaly) {
  return [
    "Plausible funnel anomaly detected.",
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
  const plausibleApiKey = process.env.PLAUSIBLE_API_KEY;
  const plausibleSiteId = process.env.PLAUSIBLE_SITE_ID;
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  requireEnv("PLAUSIBLE_API_KEY", plausibleApiKey);
  requireEnv("PLAUSIBLE_SITE_ID", plausibleSiteId);

  logger.info("report_start");

  const [pageViews24h, pageViews7d, goals24h, goals7d] = await Promise.all([
    fetchMetric(plausibleApiKey, plausibleSiteId, "24h", "pageviews"),
    fetchMetric(plausibleApiKey, plausibleSiteId, "7d", "pageviews"),
    fetchGoals(plausibleApiKey, plausibleSiteId, "24h"),
    fetchGoals(plausibleApiKey, plausibleSiteId, "7d"),
  ]);

  const totals24h = goalsTotals(goals24h);
  const totals7d = goalsTotals(goals7d);

  const report = {
    generated_at: timestampIso(),
    page_views: pageViews24h,
    cta_clicks: totals24h.cta_click,
    checkout_redirects: totals24h.checkout_redirect,
    checkout_successes: totals24h.checkout_success,
    cta_rate: ratio(totals24h.cta_click, pageViews24h),
    redirect_rate: ratio(totals24h.checkout_redirect, totals24h.cta_click),
    success_rate: ratio(totals24h.checkout_success, totals24h.checkout_redirect),
    baseline_7d: {
      page_views: pageViews7d,
      cta_clicks: totals7d.cta_click,
      checkout_redirects: totals7d.checkout_redirect,
      checkout_successes: totals7d.checkout_success,
      cta_rate: ratio(totals7d.cta_click, pageViews7d),
      redirect_rate: ratio(totals7d.checkout_redirect, totals7d.cta_click),
      success_rate: ratio(totals7d.checkout_success, totals7d.checkout_redirect),
    },
    sku_breakdown: skuBreakdown(goals24h),
    anomalies: [],
  };

  report.anomalies = detectAnomalies(report);

  await writeReport(report);

  let issuesCreatedCount = 0;
  if (githubToken && githubRepo && report.anomalies.length) {
    const openTitles = await fetchOpenIssueTitles({ token: githubToken, repo: githubRepo });
    for (const anomaly of report.anomalies) {
      const created = await createIssueWithDedupe({
        token: githubToken,
        repo: githubRepo,
        title: issueTitle(anomaly),
        body: issueBody(anomaly),
        labels: ["automation", "analytics", "funnel"],
        openTitles,
      });
      if (created) {
        issuesCreatedCount += 1;
      }
    }
  }

  logger.summary({
    job: "plausible_funnel_report",
    issues_created_count: issuesCreatedCount,
    anomaly_count: report.anomalies.length,
    cta_clicks: report.cta_clicks,
    checkout_redirects: report.checkout_redirects,
    checkout_successes: report.checkout_successes,
  });
}

main().catch((error) => {
  logger.error("fatal", { error: error.message });
  process.exit(1);
});
