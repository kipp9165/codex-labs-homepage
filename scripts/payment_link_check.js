import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const GITHUB_TOKEN = process.env.GITHUB_TOKEN;
const GITHUB_REPO = process.env.GITHUB_REPO;
const BASEROW_API_TOKEN = process.env.BASEROW_API_TOKEN;
const BASEROW_TABLE_ID = process.env.BASEROW_TABLE_ID;
const BASEROW_API_BASE = process.env.BASEROW_API_BASE || "https://api.baserow.io";

const STRIPE_PAYMENT_LINK_RE = /^https:\/\/pay\.stripe\.com\/.+/i;
const PLACEHOLDER_RE = /(TODO|REPLACE|PLACEHOLDER|TBD|INSERT|CHANGEME)/i;

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkoutUrlsPath = path.join(repoRoot, "public", "checkout-urls.json");

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isPresent(value) {
  if (typeof value === "number") {
    return Number.isFinite(value);
  }
  return value !== null && value !== undefined && normalizeString(value) !== "";
}

function pushFinding(list, item) {
  list.push({
    product_id: item.product_id || "",
    price_id: item.price_id || "",
    issue: item.issue,
    payment_link_url: item.payment_link_url || "",
    details: item.details || "",
  });
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data && data.message ? data.message : `Request failed (${response.status})`;
    throw new Error(`${message} :: ${url}`);
  }

  return data;
}

async function loadCheckoutUrls() {
  const raw = await readFile(checkoutUrlsPath, "utf8");
  const parsed = JSON.parse(raw);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("checkout-urls.json must be an object keyed by product_id");
  }

  return parsed;
}

function normalizePrices(entry) {
  if (Array.isArray(entry.prices)) {
    return entry.prices;
  }

  if (isPresent(entry.price_id) || isPresent(entry.amount) || isPresent(entry.currency) || isPresent(entry.payment_link_url)) {
    return [
      {
        price_id: entry.price_id,
        amount: entry.amount,
        currency: entry.currency,
        payment_link_url: entry.payment_link_url,
      },
    ];
  }

  return [];
}

function validateCheckoutUrls(checkoutMap) {
  const report = {
    missing_links: [],
    placeholder_links: [],
    malformed_links: [],
    orphaned_prices: [],
    baserow_mismatches: [],
  };

  const checkoutKeys = new Set();

  for (const [rawProductId, entry] of Object.entries(checkoutMap)) {
    const productId = normalizeString(rawProductId);

    if (!productId) {
      pushFinding(report.orphaned_prices, {
        issue: "missing_product_id",
        details: "Empty product_id key",
      });
      continue;
    }

    if (!entry || typeof entry !== "object" || Array.isArray(entry)) {
      pushFinding(report.orphaned_prices, {
        product_id: productId,
        issue: "invalid_product_entry",
        details: "Product entry is not an object",
      });
      continue;
    }

    if (!Array.isArray(entry.prices)) {
      pushFinding(report.orphaned_prices, {
        product_id: productId,
        issue: "missing_prices_array",
        details: "Product entry is missing prices array",
      });
    }

    const prices = normalizePrices(entry);
    if (!prices.length) {
      pushFinding(report.orphaned_prices, {
        product_id: productId,
        issue: "no_price_entries",
        details: "Product has no price entries",
      });
      continue;
    }

    for (let index = 0; index < prices.length; index += 1) {
      const price = prices[index] || {};
      const priceId = normalizeString(price.price_id);
      const amount = price.amount;
      const currency = normalizeString(price.currency);
      const paymentLinkUrl = normalizeString(price.payment_link_url);

      if (!priceId) {
        pushFinding(report.orphaned_prices, {
          product_id: productId,
          issue: "missing_price_id",
          details: `index=${index}`,
        });
      }

      if (!isPresent(amount) || !currency) {
        pushFinding(report.orphaned_prices, {
          product_id: productId,
          price_id: priceId,
          issue: "missing_amount_or_currency",
          details: `amount_present=${isPresent(amount)} currency_present=${Boolean(currency)}`,
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
          details: "Expected https://pay.stripe.com/*",
        });
      }

      if (priceId) {
        checkoutKeys.add(`${productId}::${priceId}`);
      }
    }
  }

  return { report, checkoutKeys };
}

async function loadBaserowRowsIfConfigured() {
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

function applyBaserowCrossCheck(report, checkoutKeys, baserowRows) {
  if (!Array.isArray(baserowRows) || baserowRows.length === 0) {
    return;
  }

  const baserowKeys = new Set();

  for (const row of baserowRows) {
    const productId = normalizeString(row.product_id);
    const priceId = normalizeString(row.price_id);

    if (!productId || !priceId) {
      pushFinding(report.baserow_mismatches, {
        product_id: productId,
        price_id: priceId,
        issue: "baserow_row_missing_product_or_price",
      });
      continue;
    }

    const key = `${productId}::${priceId}`;
    baserowKeys.add(key);

    if (!checkoutKeys.has(key)) {
      pushFinding(report.baserow_mismatches, {
        product_id: productId,
        price_id: priceId,
        issue: "baserow_not_in_checkout_urls",
      });
    }
  }

  for (const key of checkoutKeys) {
    if (!baserowKeys.has(key)) {
      const [productId, priceId] = key.split("::");
      pushFinding(report.baserow_mismatches, {
        product_id: productId,
        price_id: priceId,
        issue: "checkout_urls_not_in_baserow",
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
    "Payment Link completeness checker found an issue.",
    "",
    `Type: ${type}`,
    `Product ID: ${finding.product_id || "n/a"}`,
    `Price ID: ${finding.price_id || "n/a"}`,
    `Issue: ${finding.issue || "n/a"}`,
    `Payment Link URL: ${finding.payment_link_url || "n/a"}`,
    `Details: ${finding.details || "n/a"}`,
    "",
    "Fix guidance:",
    "1. Ensure each product has a prices array.",
    "2. Ensure each price has price_id, amount, currency, payment_link_url.",
    "3. Ensure payment_link_url uses https://pay.stripe.com/*.",
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

async function createIssue(title, body) {
  await fetchJson(`https://api.github.com/repos/${GITHUB_REPO}/issues`, {
    method: "POST",
    headers: {
      Authorization: `token ${GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "Content-Type": "application/json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({ title, body }),
  });
}

async function openIssuesForFindings(report) {
  if (!GITHUB_TOKEN || !GITHUB_REPO) {
    return 0;
  }

  const existingTitles = await fetchOpenIssueTitles();
  let issuesCreatedCount = 0;

  const issueTypes = ["missing_links", "placeholder_links", "malformed_links", "orphaned_prices"];

  for (const type of issueTypes) {
    const findings = Array.isArray(report[type]) ? report[type] : [];

    for (const finding of findings) {
      const title = issueTitle(type, finding);
      if (existingTitles.has(title)) {
        continue;
      }

      await createIssue(title, issueBody(type, finding));
      existingTitles.add(title);
      issuesCreatedCount += 1;
    }
  }

  return issuesCreatedCount;
}

async function main() {
  const checkoutMap = await loadCheckoutUrls();
  const { report, checkoutKeys } = validateCheckoutUrls(checkoutMap);

  const baserowRows = await loadBaserowRowsIfConfigured();
  applyBaserowCrossCheck(report, checkoutKeys, baserowRows);

  const issuesCreatedCount = await openIssuesForFindings(report);

  console.log(
    JSON.stringify(
      {
        issues_created_count: issuesCreatedCount,
        missing_links_count: report.missing_links.length,
        malformed_links_count: report.malformed_links.length,
        report,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  console.error("Payment Link completeness checker failed:", error.message);
  process.exit(1);
});
