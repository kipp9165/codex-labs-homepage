/**
 * Codex Labs Public Frontend — shared utilities
 */

/**
 * Format a price from cents (integer) to a display string.
 * @param {number} cents
 * @param {string} currency
 * @returns {string}
 */
export function formatPrice(cents, currency = 'usd') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency.toUpperCase(),
    minimumFractionDigits: 0,
  }).format(cents / 100);
}

/**
 * Get a query-string parameter by name from the current URL.
 * @param {string} name
 * @returns {string|null}
 */
export function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

/**
 * Render an alert element into a container.
 * @param {HTMLElement} container
 * @param {'success'|'error'|'info'} type
 * @param {string} message
 */
export function showAlert(container, type, message) {
  container.innerHTML = `<div class="alert alert-${type}">${message}</div>`;
}

/**
 * Fetch JSON from a URL with error handling.
 * @param {string} url
 * @returns {Promise<any>}
 */
export async function fetchJSON(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
  return res.json();
}

/**
 * Escape a string for safe insertion into HTML.
 * @param {string} str
 * @returns {string}
 */
export function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
