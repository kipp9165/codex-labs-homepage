import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { normalizeString } from "./_shared/api_helpers.js";
import { fetchAllBaserowRows, buildBaserowSkuMap } from "./_shared/baserow_helpers.js";
import { fetchOpenIssueTitles, createIssueWithDedupe } from "./_shared/github_issues.js";
import { createLogger } from "./_shared/logging.js";

const logger = createLogger("payment_link_check");

const STRIPE_PAYMENT_LINK_RE = /^https:\/\/pay\.stripe\.com\/.+/i;
const PLACEHOLDER_RE = /(TODO|REPLACE|PLACEHOLDER|TBD|INSERT|CHANGEME)/i;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkoutUrlsPath = path.join(repoRoot, "public", "checkout-urls.json");

function isPresent(value) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  return value !== null && value !== undefined && normalizeString(value) !== "";
}

function pushFinding(list, payload) {
  list.push({
    product_id: payload.product_id || "",
    price_id: payload.price_id || "",
    issue: payload.issue,
    payment_link_url: payload.payment_link_url || "",
    details: payload.details || "",
  });
}

function normalizePrices(entry) {
  if (Array.isArray(entry.prices)) {
    return entry.prices;
  }

  if (isPresent(entry.price_id) || isPresent(entry.payment_link_url) || isPresent(entry.amount) || isPresent(entry.currency)) {
    return [{
      price_id: entry.price_id,
      amount: entry.amount,
      currency: entry.currency,
      payment_link_url: entry.payment_link_url,
    }];
  }

  return [];
}

async function loadCheckoutUrls() {
  const raw = await readFile(checkoutUrlsPath, "utf8");
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("checkout-urls.json must be an object keyed by product_id");
  }
  return parsed;
}

function validateCheckoutMap(checkoutMap) {
  const report = {
    missing_links: [],
    placeholder_links: [],
    malformed_links: [],
    orphaned_prices: [],
    baserow_mismatches: [],
  };

  const checkoutKeys = new Set();

  for (const [rawProductId, productEntry] of Object.entries(checkoutMap)) {
    const productId = normalizeString(rawProductId);

    if (!productId) {
      pushFinding(report.orphaned_prices, { issue: "missing_product_id" });
      continue;
    }

    if (!productEntry || typeof productEntry !== "object" || Array.isArray(productEntry)) {
      pushFinding(report.orphaned_prices, {
        product_id: productId,
        issue: "invalid_product_entry",
      });
      continue;
    }

    if (!Array.isArray(productEntry.prices)) {
      pushFinding(report.orphaned_prices, {
        product_id: productId,
        issue: "missing_prices_array",
      });
    }

    const prices = normalizePrices(productEntry);
    if (!prices.length) {
      pushFinding(report.orphaned_prices, {
        product_id: productId,
        issue: "no_price_entries",
      });
      continue;
    }

    for (let index = 0; index < prices.length; index += 1) {
      const price = prices[index] || {};
      const priceId = normalizeString(price.price_id);
      const paymentLinkUrl = normalizeString(price.payment_link_url);

      if (!priceId) {
        pushFinding(report.orphaned_prices, {
          product_id: productId,
          issue: "missing_price_id",
          details: `index=${index}`,
        });
      }

      if (!isPresent(price.amount) || !normalizeString(price.currency)) {
        pushFinding(report.orphaned_prices, {
          product_id: productId,
          price_id: priceId,
          issue: "missing_amount_or_currency",
        });
      }

      if (!paymentLinkUrl) {
        pushFinding(report.missing_links, {
          product_id: productId,
          price_id: priceId,
          issue: "missing_payment_link_url",
        });
      } else if (PLACEHOLDER_RE.test(paymentLinkUrl)) {
        pushFinding(report.placeholder_links, {
          product_id: productId,
          price_id: priceId,
          issue: "placeholder_payment_link_url",
          payment_link_url: paymentLinkUrl,
        });
      }

      if (paymentLinkUrl && !STRIPE_PAYMENT_LINK_RE.test(paymentLinkUrl)) {
        pushFinding(report.malformed_links, {
          product_id: productId,
          price_id: priceId,
          issue: "malformed_payment_link_url",
          payment_link_url: paymentLinkUrl,
        });
      }

      if (priceId) {
        checkoutKeys.add(`${productId}::${priceId}`);
      }
    }
  }

  return { report, checkoutKeys };
}

function appendBaserowMismatches(report, checkoutKeys, baserowRows) {
  if (!baserowRows.length) {
    return;
  }

  const baserowMap = buildBaserowSkuMap(baserowRows);

  for (const key of checkoutKeys) {
    if (!baserowMap.has(key)) {
      const [productId, priceId] = key.split("::");
      pushFinding(report.baserow_mismatches, {
        product_id: productId,
        price_id: priceId,
        issue: "checkout_urls_not_in_baserow",
      });
    }
  }

  for (const key of baserowMap.keys()) {
    if (!checkoutKeys.has(key)) {
      const [productId, priceId] = key.split("::");
      pushFinding(report.baserow_mismatches, {
        product_id: productId,
        price_id: priceId,
        issue: "baserow_not_in_checkout_urls",
      });
    }
  }
}

function issueTitle(type, finding) {
  const product = finding.product_id || "unknown-product";
  const price = finding.price_id || "unknown-price";

  if (type === "missing_links") {
    return `Payment Link Missing: ${product} / ${price}`;
  }
  if (type === "placeholder_links") {
    return `Payment Link Placeholder: ${product} / ${price}`;
  }
  if (type === "malformed_links") {
    return `Payment Link Malformed: ${product} / ${price}`;
  }
  return `Payment Link Orphaned Price: ${product} / ${price}`;
}

function issueBody(type, finding) {
  return [
    `Type: ${type}`,
    "",
    "```json",
    JSON.stringify(finding, null, 2),
    "```",
    "",
    "Fix:",
    "1. Ensure product has prices array.",
    "2. Ensure each price has price_id, amount, currency, payment_link_url.",
    "3. Ensure payment_link_url uses https://pay.stripe.com/*.",
  ].join("\n");
}

async function main() {
  const baserowApiToken = process.env.BASEROW_API_TOKEN;
  const baserowTableId = process.env.BASEROW_TABLE_ID;
  const baserowApiBase = process.env.BASEROW_API_BASE || "https://api.baserow.io";
  const githubToken = process.env.GITHUB_TOKEN;
  const githubRepo = process.env.GITHUB_REPO;

  logger.info("check_start");

  const checkoutMap = await loadCheckoutUrls();
  const { report, checkoutKeys } = validateCheckoutMap(checkoutMap);

  if (baserowApiToken && baserowTableId) {
    const baserowRows = await fetchAllBaserowRows({ apiToken: baserowApiToken, tableId: baserowTableId, apiBase: baserowApiBase });
    appendBaserowMismatches(report, checkoutKeys, baserowRows);
  }

  let issuesCreatedCount = 0;
  if (githubToken && githubRepo) {
    const openTitles = await fetchOpenIssueTitles({ token: githubToken, repo: githubRepo });
    for (const type of ["missing_links", "placeholder_links", "malformed_links", "orphaned_prices"]) {
      for (const finding of report[type]) {
        const created = await createIssueWithDedupe({
          token: githubToken,
          repo: githubRepo,
          title: issueTitle(type, finding),
          body: issueBody(type, finding),
          labels: ["automation", "payment-links"],
          openTitles,
        });
        if (created) {
          issuesCreatedCount += 1;
        }
      }
    }
  }

  logger.summary({
    job: "payment_link_check",
    issues_created_count: issuesCreatedCount,
    missing_links_count: report.missing_links.length,
    malformed_links_count: report.malformed_links.length,
    placeholder_links_count: report.placeholder_links.length,
    orphaned_prices_count: report.orphaned_prices.length,
    baserow_mismatches_count: report.baserow_mismatches.length,
    report,
  });

  if (report.missing_links.length || report.placeholder_links.length || report.malformed_links.length || report.orphaned_prices.length) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  logger.error("fatal", { error: error.message });
  process.exit(1);
});
