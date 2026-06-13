/**
 * public/js/payment-links.js
 *
 * Browser-side helper that reads checkout-urls.json (generated from the
 * canonical CSV at build time) and exposes a clean lookup API.
 *
 * This module is intentionally dependency-free and must never call Stripe
 * directly. checkout-urls.json is the only data source.
 *
 * Usage:
 *   import { getCheckoutUrl, getCheckoutTiers } from "/js/payment-links.js";
 *
 *   const { url, amount } = await getCheckoutUrl("prod_USRFfa4fq2BtIe");
 */

const CHECKOUT_URLS_PATH = "/checkout-urls.json";

let _catalog = null;
let _loadPromise = null;

/**
 * Load and cache checkout-urls.json. Subsequent calls return the cached result.
 *
 * @returns {Promise<Record<string, object>>}
 */
async function loadCatalog() {
  if (_catalog) {
    return _catalog;
  }

  if (_loadPromise) {
    return _loadPromise;
  }

  _loadPromise = fetch(CHECKOUT_URLS_PATH)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`[payment-links] Failed to load ${CHECKOUT_URLS_PATH}: HTTP ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      _catalog = data;
      return _catalog;
    })
    .catch((error) => {
      _loadPromise = null;
      console.error(error.message);
      throw error;
    });

  return _loadPromise;
}

/**
 * Resolve the best payment URL for a product ID and optional price ID.
 * Returns { url, amount, currency, priceId } or null if not found.
 *
 * @param {string} productId
 * @param {string} [priceId]
 * @returns {Promise<{ url: string, amount: number, currency: string, priceId: string } | null>}
 */
export async function getCheckoutUrl(productId, priceId) {
  const catalog = await loadCatalog();
  const product = catalog[productId];

  if (!product) {
    console.warn(`[payment-links] Unknown product_id: ${productId}`);
    return null;
  }

  if (Array.isArray(product.prices) && product.prices.length) {
    const tiers = product.prices;
    const chosen = priceId
      ? tiers.find((t) => t.price_id === priceId)
      : tiers.slice().sort((a, b) => a.amount - b.amount)[0];

    if (!chosen) {
      console.warn(`[payment-links] Unknown price_id ${priceId} for product ${productId}`);
      return null;
    }

    return {
      url: chosen.payment_link_url,
      amount: chosen.amount,
      currency: chosen.currency,
      priceId: chosen.price_id,
    };
  }

  if (product.payment_link_url) {
    return {
      url: product.payment_link_url,
      amount: product.amount,
      currency: product.currency,
      priceId: product.price_id,
    };
  }

  console.warn(`[payment-links] No payment_link_url for product ${productId}`);
  return null;
}

/**
 * Return all price tiers for a product, sorted by amount ascending.
 *
 * @param {string} productId
 * @returns {Promise<Array<{ url: string, amount: number, currency: string, priceId: string }>>}
 */
export async function getCheckoutTiers(productId) {
  const catalog = await loadCatalog();
  const product = catalog[productId];

  if (!product) {
    console.warn(`[payment-links] Unknown product_id: ${productId}`);
    return [];
  }

  if (Array.isArray(product.prices) && product.prices.length) {
    return product.prices
      .map((t) => ({
        url: t.payment_link_url,
        amount: t.amount,
        currency: t.currency,
        priceId: t.price_id,
      }))
      .sort((a, b) => a.amount - b.amount);
  }

  if (product.payment_link_url) {
    return [
      {
        url: product.payment_link_url,
        amount: product.amount,
        currency: product.currency,
        priceId: product.price_id,
      },
    ];
  }

  return [];
}

/**
 * Pre-warm the catalog cache. Call early in page lifecycle to avoid a
 * cold-load delay when a user first clicks a checkout button.
 *
 * @returns {Promise<void>}
 */
export async function preloadCatalog() {
  try {
    await loadCatalog();
  } catch (_error) {
    // Swallow; individual getCheckoutUrl calls will surface errors.
  }
}
