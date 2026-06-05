import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PLAUSIBLE_API_KEY = process.env.PLAUSIBLE_API_KEY;
const PLAUSIBLE_SITE_ID = process.env.PLAUSIBLE_SITE_ID;
const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const analyticsDir = path.join(repoRoot, "analytics");
const historyDir = path.join(analyticsDir, "funnel_history");
const latestPath = path.join(analyticsDir, "funnel_latest.json");

const EVENT_SCHEMA = ["page_view", "cta_click", "checkout_redirect", "checkout_success"];
const TRACKED_GOALS = ["cta_click", "checkout_redirect", "checkout_success"];
const ALERT_THRESHOLDS = {
  countDropRatio: 0.7,
  rateDropRatio: 0.75,
};

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

function ratio(numerator, denominator) {
  if (!denominator) {
    return null;
  }
  return Number((numerator / denominator).toFixed(4));
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
    const message = data && data.error && data.error.message ? data.error.message : `Request failed (${response.status})`;
    throw new Error(`${message} :: ${url}`);
  }

  return data;
}

async function fetchPlausibleQuery(query) {
  return fetchJson("https://plausible.io/api/v2/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${PLAUSIBLE_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      site_id: PLAUSIBLE_SITE_ID,
      ...query,
    }),
  });
}

async function fetchMetric(dateRange, metric) {
  const payload = await fetchPlausibleQuery({
    date_range: dateRange,
    metrics: [metric],
  });

  const row = Array.isArray(payload.results) && payload.results[0] ? payload.results[0] : null;
  return row ? safeNumber(row.metrics && row.metrics[0]) : 0;
}

async function fetchGoalEvents(dateRange) {
  const payload = await fetchPlausibleQuery({
    date_range: dateRange,
    metrics: ["events"],
    dimensions: ["event:goal", "event:props:product_id", "event:props:price_id"],
    filters: [["is", "event:goal", TRACKED_GOALS]],
  });

  return Array.isArray(payload.results) ? payload.results : [];
}

function buildGoalTotals(rows) {
  const totals = Object.fromEntries(TRACKED_GOALS.map((goal) => [goal, 0]));

  for (const row of rows) {
    const goal = normalizeString(row.dimensions && row.dimensions[0]);
    if (!TRACKED_GOALS.includes(goal)) {
      continue;
    }

    totals[goal] += safeNumber(row.metrics && row.metrics[0]);
  }

  return totals;
}

function buildSkuBreakdown(rows) {
  const breakdown = new Map();

  for (const row of rows) {
    const goal = normalizeString(row.dimensions && row.dimensions[0]);
    const productId = normalizeString(row.dimensions && row.dimensions[1]);
    const priceId = normalizeString(row.dimensions && row.dimensions[2]);
    if (!goal || !productId || !priceId) {
      continue;
    }

    const key = `${productId}::${priceId}`;
    if (!breakdown.has(key)) {
      breakdown.set(key, {
        product_id: productId,
        price_id: priceId,
        product_name: "",
        goals: {
          cta_click: 0,
          checkout_redirect: 0,
          checkout_success: 0,
        },
      });
    }

    breakdown.get(key).goals[goal] += safeNumber(row.metrics && row.metrics[0]);
  }

  return Array.from(breakdown.values())
    .map((entry) => {
      const ctaClicks = entry.goals.cta_click;
      const redirects = entry.goals.checkout_redirect;
      const successes = entry.goals.checkout_success;

      return {
        product_id: entry.product_id,
        price_id: entry.price_id,
        product_name: entry.product_name,
        cta_clicks: ctaClicks,
        checkout_redirects: redirects,
        checkout_successes: successes,
        redirect_rate: ratio(redirects, ctaClicks),
        success_rate: ratio(successes, redirects),
      };
    })
    .sort((a, b) => {
      if (a.product_id === b.product_id) {
        return a.price_id.localeCompare(b.price_id);
      }
      return a.product_id.localeCompare(b.product_id);
    });
}

function buildSkuMap(entries) {
  const map = new Map();
  for (const entry of entries) {
    map.set(`${entry.product_id}::${entry.price_id}`, entry);
  }
  return map;
}

function dropPercentage(latest, baseline) {
  if (!baseline) {
    return null;
  }
  return Number(((1 - latest / baseline) * 100).toFixed(2));
}

function createAnomaly(metric, scope, expected, actual, last7DayAverage, productId = null, priceId = null, suggestedFix = "") {
  return {
    metric,
    scope,
    product_id: productId,
    price_id: priceId,
    expected,
    actual,
    last_7_day_average: last7DayAverage,
    drop_percentage: baselineDropSafe(actual, last7DayAverage),
    suggested_fix: suggestedFix,
  };
}

function baselineDropSafe(actual, baseline) {
  if (!baseline) {
    return null;
  }
  return Number(((1 - actual / baseline) * 100).toFixed(2));
}

function anomalyBelowThreshold(latest, baseline, isRate = false) {
  if (!baseline) {
    return false;
  }
  const threshold = isRate ? ALERT_THRESHOLDS.rateDropRatio : ALERT_THRESHOLDS.countDropRatio;
  return latest < baseline * threshold;
}

function issueTitle(anomaly) {
  const suffix = anomaly.product_id ? ` — ${anomaly.product_id}` : "";
  return `Funnel Anomaly: ${anomaly.metric} dropped${suffix}`;
}

function issueBody(anomaly, report) {
  return [
    `Metric: ${anomaly.metric}`,
    `Scope: ${anomaly.scope}`,
    `Product ID: ${anomaly.product_id || "site-wide"}`,
    `Price ID: ${anomaly.price_id || "n/a"}`,
    "",
    "```json",
    JSON.stringify(
      {
        expected: anomaly.expected,
        actual: anomaly.actual,
        last_7_day_average: anomaly.last_7_day_average,
        drop_percentage: anomaly.drop_percentage,
        funnel_snapshot: {
          page_views: report.page_views,
          cta_clicks: report.cta_clicks,
          checkout_redirects: report.checkout_redirects,
          checkout_successes: report.checkout_successes,
          cta_rate: report.cta_rate,
          redirect_rate: report.redirect_rate,
          success_rate: report.success_rate,
        },
        suggested_fix: anomaly.suggested_fix,
      },
      null,
      2
    ),
    "```",
  ].join("\n");
}

async function fetchExistingIssueTitles() {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return new Set();
  }

  const titles = new Set();
  for (let page = 1; page <= 10; page += 1) {
    const issues = await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/issues?state=open&per_page=100&page=${page}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
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

async function createGitHubIssue(anomaly, report, existingTitles) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return false;
  }

  const title = issueTitle(anomaly);
  if (existingTitles.has(title)) {
    return false;
  }

  await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      title,
      body: issueBody(anomaly, report),
    }),
  });

  existingTitles.add(title);
  return true;
}

async function writeReports(report) {
  await mkdir(historyDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const serialized = `${JSON.stringify(report, null, 2)}\n`;

  await writeFile(latestPath, serialized, "utf8");
  await writeFile(path.join(historyDir, `${timestamp}.json`), serialized, "utf8");
}

async function main() {
  requireEnv("PLAUSIBLE_API_KEY", PLAUSIBLE_API_KEY);
  requireEnv("PLAUSIBLE_SITE_ID", PLAUSIBLE_SITE_ID);

  const [pageViews24h, pageViews7d, goalRows24h, goalRows7d, skuRows24h, skuRows7d] = await Promise.all([
    fetchMetric("24h", "pageviews"),
    fetchMetric("7d", "pageviews"),
    fetchGoalEvents("24h"),
    fetchGoalEvents("7d"),
    fetchGoalEvents("24h"),
    fetchGoalEvents("7d"),
  ]);

  const totals24h = buildGoalTotals(goalRows24h);
  const totals7d = buildGoalTotals(goalRows7d);
  const sku24h = buildSkuBreakdown(skuRows24h);
  const sku7d = buildSkuBreakdown(skuRows7d);
  const sku7dMap = buildSkuMap(sku7d);

  const report = {
    generated_at: new Date().toISOString(),
    event_schema: EVENT_SCHEMA,
    window: "24h",
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
    sku_breakdown: sku24h,
    anomalies: [],
  };

  const anomalies = [];

  const ctaBaseline = totals7d.cta_click / 7;
  const redirectBaseline = totals7d.checkout_redirect / 7;
  const successBaseline = totals7d.checkout_success / 7;

  if (anomalyBelowThreshold(report.cta_clicks, ctaBaseline)) {
    anomalies.push({
      metric: "cta_clicks",
      scope: "site-wide",
      expected: Number(ctaBaseline.toFixed(2)),
      actual: report.cta_clicks,
      last_7_day_average: Number(ctaBaseline.toFixed(2)),
      drop_percentage: dropPercentage(report.cta_clicks, ctaBaseline),
      suggested_fix: "Check .buy-button tracking and confirm cta_click goals still fire in Plausible.",
    });
  }

  if (anomalyBelowThreshold(report.redirect_rate ?? 0, report.baseline_7d.redirect_rate ?? 0, true)) {
    anomalies.push({
      metric: "redirect_rate",
      scope: "site-wide",
      expected: report.baseline_7d.redirect_rate,
      actual: report.redirect_rate,
      last_7_day_average: report.baseline_7d.redirect_rate,
      drop_percentage: dropPercentage(report.redirect_rate ?? 0, report.baseline_7d.redirect_rate ?? 0),
      suggested_fix: "Check that checkout_redirect events still fire when users leave for Stripe Payment Links.",
    });
  }

  if (anomalyBelowThreshold(report.success_rate ?? 0, report.baseline_7d.success_rate ?? 0, true)) {
    anomalies.push({
      metric: "checkout_success",
      scope: "site-wide",
      expected: report.baseline_7d.success_rate,
      actual: report.success_rate,
      last_7_day_average: report.baseline_7d.success_rate,
      drop_percentage: dropPercentage(report.success_rate ?? 0, report.baseline_7d.success_rate ?? 0),
      suggested_fix: "Confirm the Stripe webhook path still emits checkout_success after successful payment.",
    });
  }

  for (const sku of report.sku_breakdown) {
    const baselineSku = sku7dMap.get(`${sku.product_id}::${sku.price_id}`);
    if (!baselineSku) {
      continue;
    }

    const ctaAvg = baselineSku.cta_clicks / 7;
    const redirectAvg = baselineSku.checkout_redirects / 7;
    const successAvg = baselineSku.checkout_successes / 7;

    if (anomalyBelowThreshold(sku.cta_clicks, ctaAvg)) {
      anomalies.push({
        metric: "cta_clicks",
        scope: "sku",
        product_id: sku.product_id,
        price_id: sku.price_id,
        expected: Number(ctaAvg.toFixed(2)),
        actual: sku.cta_clicks,
        last_7_day_average: Number(ctaAvg.toFixed(2)),
        drop_percentage: dropPercentage(sku.cta_clicks, ctaAvg),
        suggested_fix: "Check whether the SKU button lost its data-product-id/data-price-id or stopped tracking.",
      });
    }

    if (anomalyBelowThreshold(sku.redirect_rate ?? 0, baselineSku.redirect_rate ?? 0, true)) {
      anomalies.push({
        metric: "redirect_rate",
        scope: "sku",
        product_id: sku.product_id,
        price_id: sku.price_id,
        expected: baselineSku.redirect_rate,
        actual: sku.redirect_rate,
        last_7_day_average: baselineSku.redirect_rate,
        drop_percentage: dropPercentage(sku.redirect_rate ?? 0, baselineSku.redirect_rate ?? 0),
        suggested_fix: "Check the SKU's Payment Link and confirm checkout_redirect events still fire.",
      });
    }

    if (anomalyBelowThreshold(sku.success_rate ?? 0, baselineSku.success_rate ?? 0, true)) {
      anomalies.push({
        metric: "checkout_success",
        scope: "sku",
        product_id: sku.product_id,
        price_id: sku.price_id,
        expected: baselineSku.success_rate,
        actual: sku.success_rate,
        last_7_day_average: baselineSku.success_rate,
        drop_percentage: dropPercentage(sku.success_rate ?? 0, baselineSku.success_rate ?? 0),
        suggested_fix: "Confirm the SKU's Stripe checkout completion events are still emitted by the webhook path.",
      });
    }
  }

  report.anomalies = anomalies;
  await writeReports(report);

  let issuesCreatedCount = 0;
  if (anomalies.length > 0) {
    const existingTitles = await fetchExistingIssueTitles();

    for (const anomaly of anomalies) {
      const created = await createGitHubIssue(anomaly, report, existingTitles);
      if (created) {
        issuesCreatedCount += 1;
      }
    }
  }

  console.log(
    JSON.stringify(
      {
        drift_found_count: anomalies.length,
        issues_created_count: issuesCreatedCount,
        report,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Plausible funnel report failed:", error.message);
  process.exit(1);
});
