import { httpJson, normalizeString, safeNumber } from "./api_helpers.js";

function stripeHeaders(secretKey) {
  return {
    Authorization: `Bearer ${secretKey}`,
  };
}

export async function fetchStripeCollection(secretKey, resourcePath, extraParams = {}, options = {}) {
  const items = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = new URLSearchParams({ limit: "100" });
    for (const [key, value] of Object.entries(extraParams)) {
      params.set(key, String(value));
    }
    if (startingAfter) {
      params.set("starting_after", startingAfter);
    }

    const payload = await httpJson(`https://api.stripe.com/v1/${resourcePath}?${params.toString()}`, {
      method: "GET",
      headers: stripeHeaders(secretKey),
      retries: options.retries ?? 1,
    });

    const pageItems = Array.isArray(payload.data) ? payload.data : [];
    items.push(...pageItems);

    hasMore = Boolean(payload.has_more);
    startingAfter = hasMore && pageItems.length ? pageItems[pageItems.length - 1].id : null;
  }

  return items;
}

export function amountFromMinorUnits(amountMinor, currency) {
  const zeroDecimal = new Set(["bif", "clp", "djf", "gnf", "jpy", "kmf", "krw", "mga", "pyg", "rwf", "ugx", "vnd", "vuv", "xaf", "xof", "xpf"]);
  const normalizedCurrency = normalizeString(currency).toLowerCase();
  const amount = safeNumber(amountMinor);
  if (zeroDecimal.has(normalizedCurrency)) {
    return amount;
  }
  return Number((amount / 100).toFixed(2));
}
