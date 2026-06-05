"use strict";

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;
const BASEROW_API_TOKEN = process.env.BASEROW_API_TOKEN;
const BASEROW_TABLE_ID = process.env.BASEROW_TABLE_ID;
const BASEROW_API_BASE = process.env.BASEROW_API_BASE || "https://api.baserow.io";

function requireEnv(name, value) {
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

function toUnixSeconds(value) {
  return typeof value === "number" ? value : null;
}

function normalizePriceAmount(unitAmount) {
  if (typeof unitAmount !== "number") {
    return null;
  }
  return unitAmount / 100;
}

function normalizeRow(product, price) {
  return {
    product_id: product.id,
    product_name: product.name || "",
    price_id: price.id,
    amount: normalizePriceAmount(price.unit_amount),
    currency: (price.currency || "").toLowerCase(),
    active: Boolean(product.active) && Boolean(price.active),
    livemode: Boolean(price.livemode),
    created: toUnixSeconds(price.created),
    updated: toUnixSeconds(price.created),
  };
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  const text = await response.text();

  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch (_error) {
    data = { raw: text };
  }

  if (!response.ok) {
    const message = data && data.error && data.error.message
      ? data.error.message
      : `Request failed (${response.status})`;
    throw new Error(`${message} :: ${url}`);
  }

  return data;
}

async function fetchStripeCollection(resourcePath) {
  const items = [];
  let hasMore = true;
  let startingAfter = null;

  while (hasMore) {
    const params = new URLSearchParams({ limit: "100" });
    if (startingAfter) {
      params.set("starting_after", startingAfter);
    }

    const url = `https://api.stripe.com/v1/${resourcePath}?${params.toString()}`;
    const payload = await fetchJson(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
      },
    });

    const pageItems = Array.isArray(payload.data) ? payload.data : [];
    items.push(...pageItems);

    hasMore = Boolean(payload.has_more);
    startingAfter = hasMore && pageItems.length ? pageItems[pageItems.length - 1].id : null;
  }

  return items;
}

function buildNormalizedRows(products, prices) {
  const productsById = new Map(products.map((product) => [product.id, product]));
  const rows = [];

  for (const price of prices) {
    const productId = typeof price.product === "string" ? price.product : null;
    if (!productId) {
      continue;
    }

    const product = productsById.get(productId);
    if (!product) {
      continue;
    }

    rows.push(normalizeRow(product, price));
  }

  return rows;
}

async function fetchAllBaserowRows() {
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

function buildExistingRowLookup(rows) {
  const lookup = new Map();

  for (const row of rows) {
    const productId = row.product_id;
    const priceId = row.price_id;
    const rowId = row.id;

    if (!productId || !priceId || typeof rowId !== "number") {
      continue;
    }

    lookup.set(`${productId}::${priceId}`, rowId);
  }

  return lookup;
}

async function upsertBaserowRow(normalizedRow, existingRowId) {
  const baseUrl = `${BASEROW_API_BASE}/api/database/rows/table/${BASEROW_TABLE_ID}`;

  if (existingRowId) {
    const updateUrl = `${baseUrl}/${existingRowId}/?user_field_names=true`;
    await fetchJson(updateUrl, {
      method: "PATCH",
      headers: {
        Authorization: `Token ${BASEROW_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(normalizedRow),
    });
    return "updated";
  }

  const createUrl = `${baseUrl}/?user_field_names=true`;
  await fetchJson(createUrl, {
    method: "POST",
    headers: {
      Authorization: `Token ${BASEROW_API_TOKEN}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(normalizedRow),
  });
  return "created";
}

async function main() {
  requireEnv("STRIPE_SECRET_KEY", STRIPE_SECRET_KEY);
  requireEnv("BASEROW_API_TOKEN", BASEROW_API_TOKEN);
  requireEnv("BASEROW_TABLE_ID", BASEROW_TABLE_ID);

  const products = await fetchStripeCollection("products");
  const prices = await fetchStripeCollection("prices");
  const normalizedRows = buildNormalizedRows(products, prices);

  const existingRows = await fetchAllBaserowRows();
  const existingLookup = buildExistingRowLookup(existingRows);

  let syncedCount = 0;
  let updatedCount = 0;
  let errorsCount = 0;

  for (const row of normalizedRows) {
    const key = `${row.product_id}::${row.price_id}`;
    const existingRowId = existingLookup.get(key);

    try {
      const mode = await upsertBaserowRow(row, existingRowId);
      syncedCount += 1;
      if (mode === "updated") {
        updatedCount += 1;
      }
    } catch (error) {
      errorsCount += 1;
      console.error(`Failed to sync ${key}:`, error.message);
    }
  }

  console.log(
    JSON.stringify(
      {
        synced_count: syncedCount,
        updated_count: updatedCount,
        errors_count: errorsCount,
      },
      null,
      2
    )
  );

  if (errorsCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Stripe to Baserow sync failed:", error.message);
  process.exit(1);
});
