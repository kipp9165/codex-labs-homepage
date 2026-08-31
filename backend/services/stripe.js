import Stripe from "stripe";
import config from "../config.js";

const ACTIVE_STATUSES = new Set(["active"]);

function createStripeClient(runtimeConfig) {
  return runtimeConfig.stripeSecretKey ? new Stripe(runtimeConfig.stripeSecretKey) : null;
}

function evaluateWhaleTierItemMatch(item, whalePriceId, context = {}) {
  const priceId = item.price?.id;
  const planId = item.plan?.id;
  const lookupKey = item.price?.lookup_key || item.plan?.lookup_key;
  const productId = item.price?.product || item.plan?.product;
  const matched = (
    priceId === whalePriceId
    || planId === whalePriceId
    || lookupKey === whalePriceId
    || productId === whalePriceId
  );

  console.log("[DEBUG stripe-match-attempt-compound]", {
    ...context,
    whalePriceId,
    priceId,
    planId,
    lookupKey,
    productId,
    matched,
  });

  return {
    matched,
    identifier:
      priceId
      || planId
      || lookupKey
      || productId,
  };
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

  const WHALE_TIER_PRICE_ID = runtimeConfig.whaleTierPriceId;

  try {
    const subscriptions = await stripe.subscriptions.list({
      customer: normalizedCustomerId,
      limit: 100,
      status: "active",
      expand: ["data.items.data.price"],
    });

    const whaleSubscription = subscriptions.data.find((subscription) =>
      subscription.items.data.some((item, itemIndex) =>
        evaluateWhaleTierItemMatch(item, WHALE_TIER_PRICE_ID, {
          stripeCustomerId: normalizedCustomerId,
          subscriptionId: subscription.id,
          itemIndex,
        }).matched
      )
    );

    if (!whaleSubscription) {
      console.log("[DEBUG stripe-denial-compound]", {
        stripeCustomerId: normalizedCustomerId,
        whalePriceId: WHALE_TIER_PRICE_ID,
        reason: "No subscription item matched price.id, plan.id, lookup_key, or product",
        subscriptionItemPriceIds: subscriptions.data.flatMap((subscription) =>
          subscription.items.data.map((item) =>
            item.price?.id
            || item.plan?.id
            || item.price?.lookup_key
            || item.plan?.lookup_key
            || item.price?.product
            || item.plan?.product
          )
        ),
      });
      return {
        whale: false,
        customerId: normalizedCustomerId,
      };
    }

    const subscriptionItemPriceIds = whaleSubscription.items.data.map((item) =>
      item.price?.id
      || item.plan?.id
      || item.price?.lookup_key
      || item.plan?.lookup_key
      || item.price?.product
      || item.plan?.product
    );
    console.log("[DEBUG stripe-allow-compound]", {
      stripeCustomerId: normalizedCustomerId,
      whalePriceId: WHALE_TIER_PRICE_ID,
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
