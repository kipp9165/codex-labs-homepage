import { requireEnv, normalizeString, safeNumber } from "./_shared/api_helpers.js";
import { fetchStripeCollection } from "./_shared/stripe_helpers.js";
import { fetchAllBaserowRows, upsertBaserowRow } from "./_shared/baserow_helpers.js";
import { createLogger } from "./_shared/logging.js";

const logger = createLogger("stripe_to_baserow_sync");

function normalizePriceAmount(unitAmount) {
  if (typeof unitAmount !== "number") {
    return null;
  }
  return Number((unitAmount / 100).toFixed(2));
}

function normalizeRow(product, price) {
  return {
    product_id: normalizeString(product.id),
    product_name: normalizeString(product.name),
    price_id: normalizeString(price.id),
    amount: normalizePriceAmount(price.unit_amount),
    currency: normalizeString(price.currency).toLowerCase(),
    active: Boolean(product.active) && Boolean(price.active),
    livemode: Boolean(price.livemode),
    created: safeNumber(price.created, null),
    updated: safeNumber(price.created, null),
  };
}

function buildExistingRowIdMap(rows) {
  const map = new Map();
  for (const row of rows) {
    const productId = normalizeString(row.product_id);
    const priceId = normalizeString(row.price_id);
    if (!productId || !priceId || typeof row.id !== "number") {
      continue;
    }
    map.set(`${productId}::${priceId}`, row.id);
  }
  return map;
}

async function main() {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const baserowApiToken = process.env.BASEROW_API_TOKEN;
  const baserowTableId = process.env.BASEROW_TABLE_ID;
  const baserowApiBase = process.env.BASEROW_API_BASE || "https://api.baserow.io";

  requireEnv("STRIPE_SECRET_KEY", stripeSecretKey);
  requireEnv("BASEROW_API_TOKEN", baserowApiToken);
  requireEnv("BASEROW_TABLE_ID", baserowTableId);

  logger.info("sync_start");

  const [products, prices, existingRows] = await Promise.all([
    fetchStripeCollection(stripeSecretKey, "products"),
    fetchStripeCollection(stripeSecretKey, "prices"),
    fetchAllBaserowRows({ apiToken: baserowApiToken, tableId: baserowTableId, apiBase: baserowApiBase }),
  ]);

  const productsById = new Map(products.map((item) => [item.id, item]));
  const rowIdByKey = buildExistingRowIdMap(existingRows);

  let syncedCount = 0;
  let updatedCount = 0;
  let createdCount = 0;
  let errorsCount = 0;

  for (const price of prices) {
    const productId = typeof price.product === "string" ? price.product : "";
    const product = productsById.get(productId);
    if (!product) {
      continue;
    }

    const row = normalizeRow(product, price);
    const key = `${row.product_id}::${row.price_id}`;

    try {
      const rowId = rowIdByKey.get(key);
      await upsertBaserowRow({
        apiToken: baserowApiToken,
        tableId: baserowTableId,
        apiBase: baserowApiBase,
        rowId,
        payload: row,
      });
      syncedCount += 1;
      if (rowId) {
        updatedCount += 1;
      } else {
        createdCount += 1;
      }
    } catch (error) {
      errorsCount += 1;
      logger.error("row_sync_failed", { key, error: error.message });
    }
  }

  const summary = {
    job: "stripe_to_baserow_sync",
    synced_count: syncedCount,
    updated_count: updatedCount,
    created_count: createdCount,
    errors_count: errorsCount,
  };

  logger.summary(summary);

  if (errorsCount > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  logger.error("fatal", { error: error.message });
  process.exit(1);
});
