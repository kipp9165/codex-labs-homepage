import Stripe from "stripe";
import config from "./config.js";

const ACTIVE_STATUSES = new Set(["active"]);

function createStripeClient(runtimeConfig) {
  return runtimeConfig.stripeSecretKey ? new Stripe(runtimeConfig.stripeSecretKey) : null;
}

function debugStripeAllow(runtimeConfig, ...args) {
  if (!runtimeConfig.stripeAllowDebugEnabled) {
    return;
  }
  console.log("[DEBUG stripe-allow]", ...args);
}

function subscriptionHasAccess(subscription, runtimeConfig) {
  if (!ACTIVE_STATUSES.has(subscription.status)) {
    return false;
  }

  const whalePriceId = runtimeConfig.whaleTierPriceId;
  const hasAccess = subscription.items.data.some((item) => item.price?.id === whalePriceId);
  if (!hasAccess) {
    console.log(
      "[DEBUG stripe-denial]",
      "stripeCustomerId:", typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id,
      "whalePriceId:", whalePriceId,
      "subscriptionItemPriceIds:",
      subscription.items.data.map(i => i.price?.id),
      "comparisonResults:",
      subscription.items.data.map(i => ({
        itemPrice: i.price?.id,
        matchesWhale: i.price?.id === whalePriceId
      }))
    );
  }
  return hasAccess;
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

async function ensureWhaleSubscription(stripe, stripeCustomerId, whalePriceId) {
  if (!stripeCustomerId?.startsWith("cus_") || !whalePriceId) {
    return { ensured: false, created: false, subscriptionId: null, status: null };
  }

  const subscriptions = await stripe.subscriptions.list({
    customer: stripeCustomerId,
    limit: 100,
    status: "active",
    expand: ["data.items.data.price"],
  });

  const hasWhale = subscriptions.data.some((subscription) =>
    subscription.items.data.some((item) => item.price?.id === whalePriceId)
  );

  if (hasWhale) {
    const existingWhaleSubscription = subscriptions.data.find((subscription) =>
      subscription.items.data.some((item) => item.price?.id === whalePriceId)
    );
    return {
      ensured: true,
      created: false,
      subscriptionId: existingWhaleSubscription?.id || null,
      status: existingWhaleSubscription?.status || null,
    };
  }

  const createdSubscription = await stripe.subscriptions.create({
    customer: stripeCustomerId,
    items: [{ price: whalePriceId }],
    collection_method: "send_invoice",
    days_until_due: 30,
    payment_behavior: "allow_incomplete",
    expand: ["items.data.price"],
  });

  return {
    ensured: true,
    created: true,
    subscriptionId: createdSubscription.id,
    status: createdSubscription.status,
  };
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
        debugStripeAllow(
          runtimeConfig,
          "customerId:", subscriptionCustomerId,
          "subscriptionId:", subscription.id,
          "source:", "subscription_id"
        );
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

    if (resolvedCustomerId === runtimeConfig.whaleActivationCustomerId) {
      try {
        const whaleSubscription = await ensureWhaleSubscription(
          stripe,
          resolvedCustomerId,
          runtimeConfig.whaleTierPriceId
        );
        debugStripeAllow(
          runtimeConfig,
          "customerId:", resolvedCustomerId,
          "whalePriceId:", runtimeConfig.whaleTierPriceId,
          "whaleSubscriptionCreated:", whaleSubscription.created,
          "whaleSubscriptionStatus:", whaleSubscription.status
        );
        if (whaleSubscription.subscriptionId && whaleSubscription.created) {
          return {
            allowed: true,
            reason: "provisioned_subscription",
            customerId: resolvedCustomerId,
            subscriptionId: whaleSubscription.subscriptionId,
          };
        }
      } catch (error) {
        debugStripeAllow(
          runtimeConfig,
          "customerId:", resolvedCustomerId,
          "whalePriceId:", runtimeConfig.whaleTierPriceId,
          "whaleSubscriptionError:", error instanceof Error ? error.message : "subscription_create_failed"
        );
      }
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

    debugStripeAllow(
      runtimeConfig,
      "customerId:", resolvedCustomerId,
      "subscriptionId:", matchingSubscription.id,
      "source:", "customer_lookup"
    );

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
