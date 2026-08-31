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

    const whaleSubscription = subscriptions.data.find((subscription) =>
      subscription.items.data.some((item) => item.price?.id === whalePriceId)
    );

    if (!whaleSubscription) {
      console.log("[DEBUG stripe-denial]", {
        stripeCustomerId: normalizedCustomerId,
        whalePriceId,
        subscriptionItemPriceIds: subscriptions.data.flatMap((subscription) =>
          subscription.items.data.map((item) => item.price?.id)
        ),
      });
      return {
        whale: false,
        customerId: normalizedCustomerId,
      };
    }

    const subscriptionItemPriceIds = whaleSubscription.items.data.map((item) => item.price?.id);
    console.log("[DEBUG stripe-allow]", {
      stripeCustomerId: normalizedCustomerId,
      whalePriceId,
      subscriptionItemPriceIds,
    });

    return {
      whale: true,
      customerId: normalizedCustomerId,
    };
  } catch (error) {
    return {
      whale: false,
      detail: error instanceof Error ? error.message : "whale_tier_lookup_failed",
    };
  }
}
