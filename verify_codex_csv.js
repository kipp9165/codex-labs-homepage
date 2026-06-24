import { getAllProducts, getAllProductIds } from "./load-codex-csv.js";

function sampleRows(rows, count) {
  return rows.slice(0, count);
}

function fail(message) {
  console.error("FAIL:", message);
  process.exit(1);
}

function main() {
  const rows = getAllProducts();
  const uniqueProductIds = getAllProductIds();
  const nonEmptyLinks = rows.filter((row) => typeof row.paymentLinkUrl === "string" && row.paymentLinkUrl.trim().length > 0);

  console.log("Total rows:", rows.length);
  console.log("Sample rows (5):");
  sampleRows(rows, 5).forEach((row, idx) => {
    console.log(`${idx + 1}. ${row.productName} | ${row.productId} | ${row.priceId} | ${row.amount} ${row.currency} | ${row.paymentLinkUrl}`);
  });

  if (rows.length < 900) {
    fail(`Expected at least 900 valid rows, got ${rows.length}`);
  }

  if (uniqueProductIds.length < 900) {
    fail(`Expected at least 900 unique product IDs, got ${uniqueProductIds.length}`);
  }

  if (nonEmptyLinks.length < 900) {
    fail(`Expected at least 900 non-empty payment links, got ${nonEmptyLinks.length}`);
  }

  console.log("Verification passed.");
  process.exit(0);
}

try {
  main();
} catch (error) {
  console.error("Verification failed with error:", error.message);
  process.exit(1);
}
