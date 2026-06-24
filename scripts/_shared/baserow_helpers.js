import { httpJson, normalizeString } from "./api_helpers.js";

export async function fetchAllBaserowRows({ apiToken, tableId, apiBase = "https://api.baserow.io" }) {
  const rows = [];
  let next = `${apiBase}/api/database/rows/table/${tableId}/?user_field_names=true&size=200&page=1`;

  while (next) {
    const payload = await httpJson(next, {
      method: "GET",
      headers: {
        Authorization: `Token ${apiToken}`,
      },
      retries: 1,
    });

    rows.push(...(Array.isArray(payload.results) ? payload.results : []));
    next = payload.next || null;
  }

  return rows;
}

export function buildBaserowSkuMap(rows) {
  const map = new Map();

  for (const row of rows) {
    const productId = normalizeString(row.product_id);
    const priceId = normalizeString(row.price_id);
    if (!productId || !priceId) {
      continue;
    }

    map.set(`${productId}::${priceId}`, row);
  }

  return map;
}

export async function upsertBaserowRow({ apiToken, tableId, apiBase = "https://api.baserow.io", rowId, payload }) {
  const baseUrl = `${apiBase}/api/database/rows/table/${tableId}`;

  if (rowId) {
    return httpJson(`${baseUrl}/${rowId}/?user_field_names=true`, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      retries: 1,
    });
  }

  return httpJson(`${baseUrl}/?user_field_names=true`, {
    method: "POST",
    headers: {
      Authorization: `Token ${apiToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    retries: 1,
  });
}
