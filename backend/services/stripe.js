import Stripe from "stripe";
import config from "../config.js";

const ACTIVE_STATUSES = new Set(["active"]);

function createStripeClient(runtimeConfig) {
  return runtimeConfig.stripeSecretKey ? new Stripe(runtimeConfig.stripeSecretKey) : null;
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

  const whalePriceId = runtimeConfig.whaleTierPriceId;

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: normalizedCustomerId,
      limit: 100,
      status: "active",
      expand: ["data.items.data.price"],
    });

    const whale = subscriptions.data.some((subscription) =>
      subscription.items.data.some((item) => item.price?.id === whalePriceId)
    );

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
