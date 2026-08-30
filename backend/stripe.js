import Stripe from "stripe";
import config from "./config.js";

const ACTIVE_STATUSES = new Set(["active"]);

function createStripeClient(runtimeConfig) {
  return runtimeConfig.stripeSecretKey ? new Stripe(runtimeConfig.stripeSecretKey) : null;
}

function subscriptionHasAccess(subscription, runtimeConfig) {
  if (!ACTIVE_STATUSES.has(subscription.status)) {
    return false;
  }

  const whalePriceId = runtimeConfig.whaleTierPriceId;
  console.log(
    "[DEBUG enforceStripeAccess]",
    "whalePriceId:", whalePriceId,
    "itemPrices:", subscription.items.data.map((i) => i.price?.id)
  );
  return subscription.items.data.some((item) => item.price?.id === whalePriceId);
}

async function listCustomerSubscriptions(stripe, customerId, runtimeConfig) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
    status: "all",
    expand: ["data.items.data.price"],
  });

  return subscriptions.data.find((subscription) => subscriptionHasAccess(subscription, runtimeConfig));
}

async function resolveCustomerIdFromReference(stripe, reference) {
  if (!reference) {
    return null;
  }

  if (reference.startsWith("cus_")) {
    return reference;
  }

  if (!reference.includes("@")) {
    return null;
  }

  const customers = await stripe.customers.list({ email: reference, limit: 10 });
  return customers.data[0]?.id || null;
}

export async function enforceStripeAccess({ accessReference, customerId, customerEmail, subscriptionId } = {}, runtimeConfig = config) {
  const stripe = createStripeClient(runtimeConfig);

  if (!stripe) {
    return { allowed: false, reason: "stripe_access_denied", detail: "stripe_not_configured" };
  }

  try {
    if (subscriptionId?.startsWith("sub_")) {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId, {
        expand: ["items.data.price"],
      });
      const subscriptionCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id;

      if (subscriptionHasAccess(subscription, runtimeConfig)) {
        return {
          allowed: true,
          reason: "active_subscription",
          customerId: subscriptionCustomerId,
          subscriptionId: subscription.id,
        };
      }
    }

    const resolvedCustomerId = customerId?.startsWith("cus_")
      ? customerId
      : await resolveCustomerIdFromReference(stripe, accessReference || customerEmail || "");

    if (!resolvedCustomerId) {
      return { allowed: false, reason: "stripe_access_denied", detail: "missing_customer_reference" };
    }

    const matchingSubscription = await listCustomerSubscriptions(stripe, resolvedCustomerId, runtimeConfig);

    if (!matchingSubscription) {
      return {
        allowed: false,
        reason: "stripe_access_denied",
        detail: "subscription_not_found",
        customerId: resolvedCustomerId,
      };
    }

    return {
      allowed: true,
      reason: "active_subscription",
      customerId: resolvedCustomerId,
      subscriptionId: matchingSubscription.id,
    };
  } catch (error) {
    return {
      allowed: false,
      reason: "stripe_access_denied",
      detail: error instanceof Error ? error.message : "stripe_lookup_failed",
    };
  }
}
