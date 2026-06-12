/**
 * tools/verify_codex_csv.js
 *
 * Sanity-check script for tools/codex_all_payment_links.csv
 *
 * Usage:
 *   node tools/verify_codex_csv.js
 *
 * Prints:
 *   - Total rows
 *   - Total unique product IDs
 *   - 5 sample products (name, amount, paymentLinkUrl)
 *   - Assertions for a set of known products
 *
 * Exit code 0 = all assertions pass
 * Exit code 1 = at least one assertion failed (or CSV unreadable)
 */

import {
  getAllProducts,
  getProductById,
  getAllProductIds,
  CSV_PATH,
} from "./load-codex-csv.js";

// ---------------------------------------------------------------------------
// Known-good reference fixtures — update if the canonical CSV changes
// ---------------------------------------------------------------------------

const KNOWN_PRODUCTS = [
  {
    productId: "prod_USRFfa4fq2BtIe",
    expectedName: "Codex Premium Pass",
    expectedAmount: 3749,
    expectedUrlPrefix: "https://pay.codexlitigation.org/",
  },
  {
    productId: "prod_USRFzX0DgpcP9m",
    expectedName: "Codex Rituals Pack",
    expectedAmount: 1199,
    expectedUrlPrefix: "https://pay.codexlitigation.org/",
  },
  {
    productId: "prod_USRF5rnb9aK6Dq",
    expectedName: "High-Clarity Decision Protocol",
    minAmount: 1499,
    expectedUrlPrefix: "https://pay.codexlitigation.org/",
  },
  {
    productId: "prod_USRFBDgk7qoJyU",
    expectedName: "DeerSafe",
    minAmount: 1499,
    expectedUrlPrefix: "https://pay.codexlitigation.org/",
  },
  {
    productId: "prod_UPTO976NsIXrRR",
    expectedName: "Codex Labs OS",
    minAmount: 199,
    expectedUrlPrefix: "https://pay.codexlitigation.org/",
  },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let failures = 0;

function pass(label) {
  console.log(`  \u2713 PASS  ${label}`);
}

function fail(label, detail) {
  console.error(`  \u2717 FAIL  ${label}`);
  if (detail) console.error(`         ${detail}`);
  failures++;
}

function assert(condition, label, detail) {
  if (condition) {
    pass(label);
  } else {
    fail(label, detail);
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

console.log("=".repeat(62));
console.log("  Codex Labs CSV Verification");
console.log(`  Source: ${CSV_PATH}`);
console.log("=".repeat(62));

let rows;
try {
  rows = getAllProducts();
} catch (err) {
  console.error(`\n[FATAL] Failed to load CSV:\n  ${err.message}`);
  process.exit(1);
}

const productIds = getAllProductIds();

console.log(`\nSummary`);
console.log(`  Total rows (valid, non-placeholder): ${rows.length}`);
console.log(`  Unique product IDs:                  ${productIds.length}`);

// --- Sample -----------------------------------------------------------
console.log(`\nSample (first 5 products by unique ID)`);
const sampleIds = productIds.slice(0, 5);
for (const id of sampleIds) {
  const row = getProductById(id);
  if (!row) continue;
  const price = `$${row.amount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
  console.log(`  ${id}`);
  console.log(`    Name:   ${row.productName}`);
  console.log(`    Price:  ${price} ${row.currency.toUpperCase()}`);
  console.log(`    Link:   ${row.paymentLinkUrl}`);
}

// --- Assertions -------------------------------------------------------
console.log(`\nAssertions`);

assert(rows.length > 100, `CSV has more than 100 valid rows (got ${rows.length})`);
assert(productIds.length > 50, `More than 50 unique products (got ${productIds.length})`);

for (const fixture of KNOWN_PRODUCTS) {
  const row = getProductById(fixture.productId);

  assert(
    row !== null,
    `Product exists: ${fixture.productId}`,
    `Not found in CSV`
  );

  if (!row) continue;

  if (fixture.expectedName) {
    assert(
      row.productName.includes(fixture.expectedName),
      `Name contains "${fixture.expectedName}"`,
      `Got: "${row.productName}"`
    );
  }

  if (fixture.expectedAmount !== undefined) {
    assert(
      row.amount === fixture.expectedAmount,
      `Amount = ${fixture.expectedAmount} for ${fixture.productId}`,
      `Got: ${row.amount}`
    );
  }

  if (fixture.minAmount !== undefined) {
    assert(
      row.amount >= fixture.minAmount,
      `Amount >= ${fixture.minAmount} for ${fixture.productId}`,
      `Got: ${row.amount}`
    );
  }

  if (fixture.expectedUrlPrefix) {
    assert(
      row.paymentLinkUrl.startsWith(fixture.expectedUrlPrefix),
      `Payment link starts with "${fixture.expectedUrlPrefix}" for ${fixture.productId}`,
      `Got: "${row.paymentLinkUrl}"`
    );
  }

  assert(
    row.paymentLinkUrl.length > 0,
    `Non-empty paymentLinkUrl for ${fixture.productId}`
  );
}

// --- Summary ----------------------------------------------------------
console.log("\n" + "=".repeat(62));
if (failures === 0) {
  console.log("  ALL CHECKS PASSED");
} else {
  console.error(`  ${failures} CHECK(S) FAILED`);
}
console.log("=".repeat(62) + "\n");

process.exit(failures > 0 ? 1 : 0);
