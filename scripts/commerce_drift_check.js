import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { requireEnv, normalizeString } from "./_shared/api_helpers.js";
import { fetchStripeCollection } from "./_shared/stripe_helpers.js";
import { fetchAllBaserowRows, buildBaserowSkuMap } from "./_shared/baserow_helpers.js";
import { fetchOpenIssueTitles, createIssueWithDedupe } from "./_shared/github_issues.js";
import { timestampIso } from "./_shared/time_utils.js";
import { createLogger } from "./_shared/logging.js";

const logger = createLogger("commerce_drift_check");

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkoutUrlsPath = path.join(repoRoot, "public", "checkout-urls.json");

async function loadCheckoutUrls() {
  const raw = await readFile(checkoutUrlsPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("checkout-urls.json must be an object keyed by product_id");
  }
  return parsed;
}

function normalizeCheckoutRows(checkoutMap) {
  const rows = [];
  for (const [rawProductId, entry] of Object.entries(checkoutMap)) {
    const productId = normalizeString(rawProductId);
    const prices = Array.isArray(entry.prices)
      ? entry.prices
      : [{
        price_id: entry.price_id,
        amount: entry.amount,
        currency: entry.currency,
        payment_link_url: entry.payment_link_url,
      }];

    for (const price of prices) {
      const priceId = normalizeString(price && price.price_id);
      if (!productId || !priceId) {
        continue;
      }
      rows.push({
        product_id: productId,
        price_id: priceId,
        amount: typeof price.amount === "number" ? price.amount : null,
        currency: normalizeString(price.currency).toLowerCase(),
        payment_link_url: normalizeString(price.payment_link_url),
      });
    }
  }
  return rows;
}

function keyOf(row) {
  return `${row.product_id}::${row.price_id}`;
}

function issueTitle(category) {
  return `Commerce Drift: ${category}`;
}

function issueBody(category, findings) {
  return [
    `Category: ${category}`,
    "",
    "```json",
    JSON.stringify(findings, null, 2),
    "```",
  ].join("\n");
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

  const [checkoutMap, stripePrices, stripeProducts, baserowRows] = await Promise.all([
    loadCheckoutUrls(),
    fetchStripeCollection(stripeSecretKey, "prices"),
    fetchStripeCollection(stripeSecretKey, "products"),
    fetchAllBaserowRows({ apiToken: baserowApiToken, tableId: baserowTableId, apiBase: baserowApiBase }),
  ]);

  const checkoutRows = normalizeCheckoutRows(checkoutMap);
  const checkoutKeys = new Set(checkoutRows.map(keyOf));

  const productById = new Map(stripeProducts.map((item) => [item.id, item]));
  const stripeRows = [];
  for (const price of stripePrices) {
    if (typeof price.product !== "string") {
      continue;
    }
    const product = productById.get(price.product);
    if (!product) {
      continue;
    }
    stripeRows.push({
      product_id: normalizeString(product.id),
      price_id: normalizeString(price.id),
      amount: typeof price.unit_amount === "number" ? Number((price.unit_amount / 100).toFixed(2)) : null,
      currency: normalizeString(price.currency).toLowerCase(),
    });
  }

  const stripeByKey = new Map(stripeRows.map((row) => [keyOf(row), row]));
  const baserowByKey = buildBaserowSkuMap(baserowRows);

  const report = {
    generated_at: timestampIso(),
    checkout_missing_in_stripe: [],
    stripe_missing_in_checkout: [],
    checkout_missing_in_baserow: [],
    baserow_missing_in_checkout: [],
    field_mismatches: [],
  };

  for (const row of checkoutRows) {
    const key = keyOf(row);
    const stripe = stripeByKey.get(key);
    const baserow = baserowByKey.get(key);

    if (!stripe) {
      report.checkout_missing_in_stripe.push(row);
      continue;
    }

    if (!baserow) {
      report.checkout_missing_in_baserow.push(row);
    }

    const mismatches = [];
    if (typeof row.amount === "number" && typeof stripe.amount === "number" && row.amount !== stripe.amount) {
      mismatches.push({ field: "amount", checkout: row.amount, stripe: stripe.amount });
    }
    if (row.currency && stripe.currency && row.currency !== stripe.currency) {
      mismatches.push({ field: "currency", checkout: row.currency, stripe: stripe.currency });
    }

    if (mismatches.length) {
      report.field_mismatches.push({
        product_id: row.product_id,
        price_id: row.price_id,
        mismatches,
      });
    }
  }

  for (const row of stripeRows) {
    const key = keyOf(row);
    if (!checkoutKeys.has(key)) {
      report.stripe_missing_in_checkout.push(row);
    }
  }

  for (const [key, row] of baserowByKey.entries()) {
    if (!checkoutKeys.has(key)) {
      report.baserow_missing_in_checkout.push({
        product_id: normalizeString(row.product_id),
        price_id: normalizeString(row.price_id),
      });
    }
  }

  let issuesCreatedCount = 0;
  if (githubToken && githubRepo) {
    const openTitles = await fetchOpenIssueTitles({ token: githubToken, repo: githubRepo });
    const categories = [
      ["checkout_missing_in_stripe", report.checkout_missing_in_stripe],
      ["stripe_missing_in_checkout", report.stripe_missing_in_checkout],
      ["checkout_missing_in_baserow", report.checkout_missing_in_baserow],
      ["baserow_missing_in_checkout", report.baserow_missing_in_checkout],
      ["field_mismatches", report.field_mismatches],
    ];

    for (const [category, findings] of categories) {
      if (!findings.length) {
        continue;
      }
      const created = await createIssueWithDedupe({
        token: githubToken,
        repo: githubRepo,
        title: issueTitle(category),
        body: issueBody(category, findings.slice(0, 100)),
        labels: ["automation", "commerce", "drift"],
        openTitles,
      });
      if (created) {
        issuesCreatedCount += 1;
      }
    }
  }

  logger.summary({
    job: "commerce_drift_check",
    issues_created_count: issuesCreatedCount,
    checkout_missing_in_stripe_count: report.checkout_missing_in_stripe.length,
    stripe_missing_in_checkout_count: report.stripe_missing_in_checkout.length,
    checkout_missing_in_baserow_count: report.checkout_missing_in_baserow.length,
    baserow_missing_in_checkout_count: report.baserow_missing_in_checkout.length,
    field_mismatches_count: report.field_mismatches.length,
    report,
  });

  if (
    report.checkout_missing_in_stripe.length ||
    report.stripe_missing_in_checkout.length ||
    report.checkout_missing_in_baserow.length ||
    report.baserow_missing_in_checkout.length ||
    report.field_mismatches.length
  ) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  logger.error("fatal", { error: error.message });
  process.exit(1);
});
