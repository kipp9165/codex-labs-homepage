import Stripe from "stripe";
import config from "../config.js";

const ACTIVE_STATUSES = new Set(["active"]);
const WHALE_PRODUCT_TOKENS = new Set(["whale_tier", "whale tier"]);

function createStripeClient(runtimeConfig) {
  return runtimeConfig.stripeSecretKey ? new Stripe(runtimeConfig.stripeSecretKey) : null;
}

function normalizeProductTokens(product) {
  if (!product) {
    return [];
  }

  if (typeof product === "string") {
    return [product.trim().toLowerCase()];
  }

  return [
    product.id,
    product.name,
    product.lookup_key,
    product.metadata?.code,
    product.metadata?.tier,
    product.metadata?.product,
  ]
    .filter(Boolean)
    .map((value) => String(value).trim().toLowerCase());
}

function isWhaleProduct(product) {
  return normalizeProductTokens(product).some((token) => WHALE_PRODUCT_TOKENS.has(token));
}

export async function verifyWhaleTier(customerId, runtimeConfig = config) {
  const normalizedCustomerId = typeof customerId === "string" ? customerId.trim() : "";
  if (!normalizedCustomerId.startsWith("cus_")) {
    return { whale: false };
  }

  const stripe = createStripeClient(runtimeConfig);
  if (!stripe) {
    return { whale: false };
  }

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: normalizedCustomerId,
      limit: 100,
      status: "all",
      expand: ["data.items.data.price.product"],
    });

    const whale = subscriptions.data.some((subscription) => (
      ACTIVE_STATUSES.has(subscription.status)
      && subscription.items.data.some((item) => isWhaleProduct(item.price?.product))
    ));

    return {
      whale,
      customerId: normalizedCustomerId,
    };
  } catch (error) {
    return {
      whale: false,
      detail: error instanceof Error ? error.message : "whale_tier_lookup_failed",
    };
  }
}
