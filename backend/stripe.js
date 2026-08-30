import Stripe from "stripe";
import config from "./config.js";

const ACTIVE_STATUSES = new Set(["active"]);

function createStripeClient(runtimeConfig) {
  return runtimeConfig.stripeSecretKey ? new Stripe(runtimeConfig.stripeSecretKey) : null;
}

function productMatches(product, runtimeConfig) {
  if (!product) {
    return false;
  }

  if (typeof product === "string") {
    return false;
  }

  return product.name === runtimeConfig.stripeProductName;
}

function subscriptionHasAccess(subscription, runtimeConfig) {
  if (!ACTIVE_STATUSES.has(subscription.status)) {
    return false;
  }

  return subscription.items.data.some((item) => productMatches(item.price?.product, runtimeConfig));
}

async function listCustomerSubscriptions(stripe, customerId, runtimeConfig) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
    status: "all",
    expand: ["data.items.data.price.product"],
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
        expand: ["items.data.price.product"],
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
