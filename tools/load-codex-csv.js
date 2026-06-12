/**
 * tools/load-codex-csv.js
 *
 * Canonical data loader for Codex Labs product/pricing data.
 * Single source of truth: tools/codex_all_payment_links.csv
 *
 * ── Contract ───────────────────────────────────────────────────────────────
 * CSV columns (header row required, exact order):
 *   product_name, product_id, price_id, amount, currency, payment_link_url
 *
 * Each row becomes a { productName, productId, priceId, amount, currency,
 * paymentLinkUrl } object.  The same productId may appear on multiple rows
 * (one row per price tier).
 *
 * ── Usage ──────────────────────────────────────────────────────────────────
 *   import { getAllProducts, getProductById, getProductsByName,
 *            getRowsByProductId } from './tools/load-codex-csv.js';
 *
 *   // One-shot parse (file is read once and cached in-process)
 *   const products = getAllProducts();
 *
 * ── Environment ────────────────────────────────────────────────────────────
 * Node ≥ 18, ESM. Works in Render and local dev without env-specific config.
 * No browser use — this module calls fs.readFileSync.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Canonical CSV — do not change this path without updating all references. */
export const CSV_PATH = path.resolve(__dirname, "codex_all_payment_links.csv");

// ---------------------------------------------------------------------------
// Text normalization
// (Handles double-encoded UTF-8 that can appear in exported CSVs)
// ---------------------------------------------------------------------------

const ENCODING_FIXES = [
  ["\u00E2\u20AC\u201D", "\u2014"], // em dash
  ["\u00E2\u20AC\u2018", "\u2011"], // non-breaking hyphen
  ["\u00E2\u20AC\u2122", "\u2019"], // right single quote
  ["\u00E2\u20AC\u0153", "\u201C"], // left double quote
  ["\u00E2\u20AC\u009D", "\u201D"], // right double quote
  ["\u00E2\u20AC\u201C", "\u2013"], // en dash
  ["\u00E2\u20AC\u00A6", "\u2026"], // ellipsis
  ["\u00C2", ""],                   // stray byte
];

function normalizeText(raw) {
  let s = (raw || "").trim();
  for (const [bad, good] of ENCODING_FIXES) {
    s = s.split(bad).join(good);
  }
  return s;
}

// ---------------------------------------------------------------------------
// CSV parser (RFC 4180, handles quoted fields with embedded commas/newlines)
// ---------------------------------------------------------------------------

function parseCsvLine(line) {
  const cells = [];
  let cell = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cell += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (ch === "," && !inQuotes) {
      cells.push(cell);
      cell = "";
    } else {
      cell += ch;
    }
  }
  cells.push(cell);
  return cells;
}

const EXPECTED_HEADER = "product_name,product_id,price_id,amount,currency,payment_link_url";

/** @returns {import('./types.js').CodexProduct[]} */
function parseCsv(csvText) {
  const lines = csvText
    .replace(/^\uFEFF/, "") // strip BOM
    .split(/\r?\n/)
    .filter((l) => l.trim().length > 0);

  if (lines.length === 0) {
    throw new Error("[load-codex-csv] CSV is empty");
  }

  const headerCells = parseCsvLine(lines[0]).map((h) => h.trim());
  const actualHeader = headerCells.join(",");
  if (actualHeader !== EXPECTED_HEADER) {
    throw new Error(
      `[load-codex-csv] Unexpected CSV header.\n  Expected: ${EXPECTED_HEADER}\n  Got:      ${actualHeader}`
    );
  }

  const records = [];

  for (let i = 1; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);

    if (cells.length !== 6) {
      throw new Error(
        `[load-codex-csv] Row ${i + 1}: expected 6 columns, got ${cells.length}.\n  Line: ${lines[i]}`
      );
    }

    const amount = parseFloat(cells[3]);
    if (!Number.isFinite(amount)) {
      throw new Error(
        `[load-codex-csv] Row ${i + 1}: invalid amount "${cells[3]}"`
      );
    }

    const paymentLinkUrl = cells[5].trim();

    // Skip rows that still carry an unfilled placeholder
    if (paymentLinkUrl.includes("REPLACE_WITH_REAL_PAYMENT_LINK")) {
      continue;
    }

    records.push({
      productName:    normalizeText(cells[0]),
      productId:      cells[1].trim(),
      priceId:        cells[2].trim(),
      amount,
      currency:       cells[4].trim().toLowerCase(),
      paymentLinkUrl,
    });
  }

  return records;
}

// ---------------------------------------------------------------------------
// Module-level cache — CSV is read once per process
// ---------------------------------------------------------------------------

let _cache = null;

/**
 * Load and parse the CSV, returning all valid product rows.
 * Result is cached; call clearCache() in tests to reset.
 *
 * @returns {import('./types.js').CodexProduct[]}
 */
export function getAllProducts() {
  if (_cache) return _cache;

  if (!fs.existsSync(CSV_PATH)) {
    throw new Error(
      `[load-codex-csv] CSV not found: ${CSV_PATH}\n` +
        "  Ensure tools/codex_all_payment_links.csv is present in the repo."
    );
  }

  const raw = fs.readFileSync(CSV_PATH, "utf8");
  _cache = parseCsv(raw);
  return _cache;
}

/**
 * Return all rows for a single productId (one row per price tier).
 * Returns [] if not found — never throws.
 *
 * @param {string} productId  e.g. "prod_USRFfa4fq2BtIe"
 * @returns {import('./types.js').CodexProduct[]}
 */
export function getRowsByProductId(productId) {
  return getAllProducts().filter((r) => r.productId === productId);
}

/**
 * Return the first row matching a productId (cheapest price tier after sort).
 * Returns null if not found.
 *
 * @param {string} productId
 * @returns {import('./types.js').CodexProduct | null}
 */
export function getProductById(productId) {
  const rows = getRowsByProductId(productId);
  if (rows.length === 0) return null;
  if (rows.length === 1) return rows[0];
  // Return lowest-amount tier by default
  return [...rows].sort((a, b) => a.amount - b.amount)[0];
}

/**
 * Case-insensitive name search — returns all rows whose productName contains
 * the query string.
 *
 * @param {string} query
 * @returns {import('./types.js').CodexProduct[]}
 */
export function getProductsByName(query) {
  const q = query.toLowerCase();
  return getAllProducts().filter((r) => r.productName.toLowerCase().includes(q));
}

/**
 * Return all rows that share the same productName prefix/category.
 * Useful for grouping scrolls, modules, passes, etc.
 *
 * @param {string} category  Substring to match against productName
 * @returns {import('./types.js').CodexProduct[]}
 */
export function getProductsByCategory(category) {
  return getProductsByName(category);
}

/**
 * Return a deduplicated list of all unique productIds.
 *
 * @returns {string[]}
 */
export function getAllProductIds() {
  return [...new Set(getAllProducts().map((r) => r.productId))];
}

/**
 * Clear the in-process cache. Useful in test harnesses.
 */
export function clearCache() {
  _cache = null;
}
