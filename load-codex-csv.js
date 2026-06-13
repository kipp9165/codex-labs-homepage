/**
 * Canonical loader for Codex Labs checkout data.
 * Single source of truth: tools/codex_all_payment_links.csv
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const CSV_PATH = path.resolve(__dirname, "tools/codex_all_payment_links.csv");

const ENCODING_FIXES = [
  ["\u00E2\u20AC\u201D", "\u2014"],
  ["\u00E2\u20AC\u2018", "\u2011"],
  ["\u00E2\u20AC\u2122", "\u2019"],
  ["\u00E2\u20AC\u0153", "\u201C"],
  ["\u00E2\u20AC\u009D", "\u201D"],
  ["\u00E2\u20AC\u201C", "\u2013"],
  ["\u00E2\u20AC\u00A6", "\u2026"],
  ["\u00C2", ""],
];

const EXPECTED_HEADER = "product_name,product_id,price_id,amount,currency,payment_link_url";

let cache = null;

function normalizeText(raw) {
  let value = (raw || "").trim();
  for (const [bad, good] of ENCODING_FIXES) {
    value = value.split(bad).join(good);
  }
  return value;
}

function parseCsvLine(line) {
  const cells = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      cells.push(current);
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current);
  return cells;
}

function inferCategory(productName) {
  const name = String(productName || "").trim();
  if (!name) {
    return "uncategorized";
  }

  const dashSeparated = name.split(/\s+[\u2013\u2014-]\s+/)[0];
  const pipeSeparated = dashSeparated.split("|")[0];
  const prefix = pipeSeparated.trim();
  if (prefix) {
    return prefix.toLowerCase();
  }

  const words = name.split(/\s+/).slice(0, 2).join(" ").trim();
  return (words || name).toLowerCase();
}

function parseCsv(csvText) {
  const lines = csvText
    .replace(/^\uFEFF/, "")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  if (!lines.length) {
    const error = new Error("[load-codex-csv] CSV is empty");
    console.error(error.message);
    throw error;
  }

  const headers = parseCsvLine(lines[0]).map((header) => header.trim());
  if (headers.join(",") !== EXPECTED_HEADER) {
    const error = new Error(`[load-codex-csv] Unexpected CSV header. Expected ${EXPECTED_HEADER}, got ${headers.join(",")}`);
    console.error(error.message);
    throw error;
  }

  const records = [];

  for (let i = 1; i < lines.length; i += 1) {
    const line = lines[i];
    const cells = parseCsvLine(line);

    if (cells.length !== 6) {
      const error = new Error(`[load-codex-csv] Malformed row ${i + 1}: expected 6 columns, got ${cells.length}`);
      console.error(error.message);
      throw error;
    }

    const amount = Number.parseFloat(cells[3]);
    if (!Number.isFinite(amount)) {
      const error = new Error(`[load-codex-csv] Invalid amount on row ${i + 1}: ${cells[3]}`);
      console.error(error.message);
      throw error;
    }

    const paymentLinkUrl = cells[5].trim();
    if (!paymentLinkUrl || paymentLinkUrl.includes("REPLACE_WITH_REAL_PAYMENT_LINK")) {
      continue;
    }

    const productName = normalizeText(cells[0]);
    records.push({
      productName,
      productId: cells[1].trim(),
      priceId: cells[2].trim(),
      amount,
      currency: cells[4].trim().toLowerCase(),
      paymentLinkUrl,
      category: inferCategory(productName),
    });
  }

  return records;
}

export function getAllProducts() {
  if (cache) {
    return cache;
  }

  if (!fs.existsSync(CSV_PATH)) {
    const error = new Error(`[load-codex-csv] CSV not found at ${CSV_PATH}`);
    console.error(error.message);
    throw error;
  }

  try {
    const csvText = fs.readFileSync(CSV_PATH, "utf8");
    cache = parseCsv(csvText);
    return cache;
  } catch (error) {
    console.error("[load-codex-csv] Failed to parse canonical CSV:", error.message);
    throw error;
  }
}

export function getRowsByProductId(productId) {
  return getAllProducts().filter((row) => row.productId === productId);
}

export function getProductById(productId) {
  const rows = getRowsByProductId(productId);
  if (!rows.length) {
    return null;
  }

  return rows
    .slice()
    .sort((a, b) => (a.amount === b.amount ? a.priceId.localeCompare(b.priceId) : a.amount - b.amount))[0];
}

export function getProductsByName(query) {
  const normalized = String(query || "").trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return getAllProducts().filter((row) => row.productName.toLowerCase().includes(normalized));
}

export function getProductsByCategory(category) {
  const normalized = String(category || "").trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return getAllProducts().filter((row) => row.category === normalized || row.category.startsWith(normalized));
}

export function getAllProductIds() {
  return Array.from(new Set(getAllProducts().map((row) => row.productId))).sort();
}

export function clearCache() {
  cache = null;
}
