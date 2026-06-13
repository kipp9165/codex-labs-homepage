/**
 * src/services/payment-links.js
 *
 * Server-side service module that exposes structured payment-link data
 * sourced exclusively from tools/codex_all_payment_links.csv via the
 * canonical loader at /load-codex-csv.js.
 *
 * Usage (Node ≥ 18, ESM):
 *   import { getPaymentLink, listPaymentLinks } from "./src/services/payment-links.js";
 *
 *   const link = getPaymentLink("prod_USRFfa4fq2BtIe");
 *   // → { productName, productId, priceId, amount, currency, paymentLinkUrl }
 *
 * Source of truth: tools/codex_all_payment_links.csv
 * Do NOT hard-code payment URLs elsewhere in server code.
 */

import {
  getAllProducts,
  getProductById,
  getRowsByProductId,
  getProductsByName,
  getAllProductIds,
} from "../../load-codex-csv.js";

/**
 * Return all payment-link rows from the canonical CSV.
 * Each row: { productName, productId, priceId, amount, currency, paymentLinkUrl }
 *
 * @returns {import("../../load-codex-csv.js").CodexProduct[]}
 */
export function listPaymentLinks() {
  return getAllProducts();
}

/**
 * Return the cheapest price-tier row for a given product ID, or null.
 *
 * @param {string} productId  Stripe product ID, e.g. "prod_USRFfa4fq2BtIe"
 * @returns {import("../../load-codex-csv.js").CodexProduct | null}
 */
export function getPaymentLink(productId) {
  if (!productId || typeof productId !== "string") {
    return null;
  }
  return getProductById(productId);
}

/**
 * Return all price-tier rows for a given product ID (one row per tier).
 *
 * @param {string} productId
 * @returns {import("../../load-codex-csv.js").CodexProduct[]}
 */
export function getPaymentLinkTiers(productId) {
  if (!productId || typeof productId !== "string") {
    return [];
  }
  return getRowsByProductId(productId);
}

/**
 * Find payment-link rows by a partial product name (case-insensitive).
 *
 * @param {string} query
 * @returns {import("../../load-codex-csv.js").CodexProduct[]}
 */
export function findPaymentLinksByName(query) {
  return getProductsByName(query);
}

/**
 * Return all unique product IDs present in the CSV.
 *
 * @returns {string[]}
 */
export function listProductIds() {
  return getAllProductIds();
}

/**
 * Build a lookup map keyed by product ID for O(1) access.
 * Value is the cheapest price-tier row for each product.
 *
 * @returns {Record<string, import("../../load-codex-csv.js").CodexProduct>}
 */
export function buildPaymentLinkMap() {
  const map = {};
  for (const id of getAllProductIds()) {
    const row = getProductById(id);
    if (row) {
      map[id] = row;
    }
  }
  return map;
}
