import Stripe from "stripe";
import config from "../config.js";

const STRIPE_API_VERSION = "2024-06-20";
const WHALE_TIER_FEATURE_KEY = "whale_tier_access";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createStripeClient(runtimeConfig = config) {
  return runtimeConfig.stripeSecretKey
    ? new Stripe(runtimeConfig.stripeSecretKey, { apiVersion: STRIPE_API_VERSION })
    : null;
}

function summarizeEntitlement(entitlement) {
  const featureId = typeof entitlement.feature === "string"
    ? entitlement.feature
    : entitlement.feature?.id;
  const featureLookupKey = typeof entitlement.feature === "string"
    ? ""
    : entitlement.feature?.lookup_key || "";

  return {
    id: entitlement.id,
    lookupKey: entitlement.lookup_key || "",
    featureId: featureId || "",
    featureLookupKey,
  };
}

function matchesWhaleTierEntitlement(entitlement, featureKey = WHALE_TIER_FEATURE_KEY) {
  const summary = summarizeEntitlement(entitlement);
  return [summary.lookupKey, summary.featureLookupKey].includes(featureKey);
}

function summarizeSubscription(subscription) {
  if (!subscription) {
    return null;
  }

  const items = Array.isArray(subscription.items?.data) ? subscription.items.data : [];

  return {
    id: subscription.id || "",
    status: subscription.status || "",
    metadata: subscription.metadata || {},
    priceIds: items.map((item) => item.price?.id).filter(Boolean),
    priceLookupKeys: items.map((item) => item.price?.lookup_key).filter(Boolean),
    productIds: items
      .map((item) => (typeof item.price?.product === "string" ? item.price.product : item.price?.product?.id))
      .filter(Boolean),
  };
}

async function retrieveSubscriptionCustomerId(stripe, subscriptionId) {
  const subscription = await stripe.subscriptions.retrieve(subscriptionId);
  return typeof subscription.customer === "string" ? subscription.customer : subscription.customer?.id || "";
}

async function listCustomerSubscriptions(stripe, customerId) {
  const subscriptions = await stripe.subscriptions.list({
    customer: customerId,
    limit: 100,
    status: "all",
    expand: ["data.items.data.price"],
  });

  return subscriptions.data;
}

async function resolveSubscriptionSummary(stripe, customerId, preferredSubscriptionId = "") {
  const normalizedSubscriptionId = normalizeString(preferredSubscriptionId);

  if (normalizedSubscriptionId.startsWith("sub_")) {
    try {
      const subscription = await stripe.subscriptions.retrieve(normalizedSubscriptionId, {
        expand: ["items.data.price"],
      });
      const subscriptionCustomerId = typeof subscription.customer === "string"
        ? subscription.customer
        : subscription.customer?.id || "";

      if (subscriptionCustomerId === customerId) {
        return summarizeSubscription(subscription);
      }
    } catch (error) {
      console.error("[WhaleTier] Error fetching preferred subscription", error);
    }
  }

  const subscriptions = await listCustomerSubscriptions(stripe, customerId);
  const prioritizedSubscription = subscriptions.find((subscription) => subscription.status === "active")
    || subscriptions.find((subscription) => subscription.status === "trialing")
    || subscriptions[0];

  return summarizeSubscription(prioritizedSubscription);
}

export async function resolveStripeCustomerId({
  accessReference = "",
  customerId = "",
  customerEmail = "",
  subscriptionId = "",
} = {}, runtimeConfig = config) {
  const normalizedCustomerId = normalizeString(customerId);
  if (normalizedCustomerId.startsWith("cus_")) {
    return normalizedCustomerId;
  }

  const stripe = createStripeClient(runtimeConfig);
  if (!stripe) {
    return "";
  }

  const normalizedSubscriptionId = normalizeString(subscriptionId);
  if (normalizedSubscriptionId.startsWith("sub_")) {
    try {
      const subscriptionCustomerId = await retrieveSubscriptionCustomerId(stripe, normalizedSubscriptionId);
      if (subscriptionCustomerId.startsWith("cus_")) {
        return subscriptionCustomerId;
      }
    } catch (error) {
      console.error("[WhaleTier] Error resolving customer from subscription", error);
    }
  }

  for (const candidate of [accessReference, customerEmail].map(normalizeString)) {
    if (!candidate) {
      continue;
    }

    if (candidate.startsWith("cus_")) {
      return candidate;
    }

    if (!candidate.includes("@")) {
      continue;
    }

    try {
      const customers = await stripe.customers.list({ email: candidate, limit: 1 });
      const resolvedCustomerId = customers.data[0]?.id || "";
      if (resolvedCustomerId.startsWith("cus_")) {
        return resolvedCustomerId;
      }
    } catch (error) {
      console.error("[WhaleTier] Error resolving customer from email", error);
    }
  }

  return "";
}

export async function getWhaleTierAccessState(
  customerId,
  { subscriptionId = "", featureKey = WHALE_TIER_FEATURE_KEY } = {},
  runtimeConfig = config,
) {
  const normalizedCustomerId = normalizeString(customerId);
  const normalizedFeatureKey = normalizeString(featureKey) || WHALE_TIER_FEATURE_KEY;
  if (!runtimeConfig.stripeSecretKey) {
    console.error("[WhaleTier] Missing STRIPE_SECRET_KEY");
    return {
      hasWhaleTier: false,
      customerId: normalizedCustomerId,
      matchedEntitlements: [],
      subscription: null,
      detail: "stripe_not_configured",
    };
  }

  if (!normalizedCustomerId) {
    console.error("[WhaleTier] Missing customerId");
    return {
      hasWhaleTier: false,
      customerId: "",
      matchedEntitlements: [],
      subscription: null,
      detail: "missing_customer_id",
    };
  }

  const stripe = createStripeClient(runtimeConfig);

  try {
    const entitlements = await stripe.entitlements.activeEntitlements.list({
      customer: normalizedCustomerId,
      feature: normalizedFeatureKey,
      expand: ["data.feature"],
      limit: 100,
    });

    const matchedEntitlements = entitlements.data
      .filter((entitlement) => matchesWhaleTierEntitlement(entitlement, normalizedFeatureKey))
      .map(summarizeEntitlement);
    const hasWhaleTier = matchedEntitlements.length > 0;
    const subscription = await resolveSubscriptionSummary(stripe, normalizedCustomerId, subscriptionId);

    console.log(
      `[WhaleTier] customer=${normalizedCustomerId} hasWhaleTier=${hasWhaleTier} entitlementCount=${matchedEntitlements.length}`,
    );

    return {
      hasWhaleTier,
      customerId: normalizedCustomerId,
      matchedEntitlements,
      subscription,
      detail: "entitlements_checked",
    };
  } catch (error) {
    console.error("[WhaleTier] Error fetching entitlements", error);
    return {
      hasWhaleTier: false,
      customerId: normalizedCustomerId,
      matchedEntitlements: [],
      subscription: null,
      detail: error instanceof Error ? error.message : "whale_tier_lookup_failed",
    };
  }
}

export async function checkWhaleTier(
  customerId,
  featureKey = WHALE_TIER_FEATURE_KEY,
  runtimeConfig = config,
) {
  const entitlementState = await getWhaleTierAccessState(
    customerId,
    { featureKey },
    runtimeConfig,
  );
  return entitlementState.hasWhaleTier;
}

export { WHALE_TIER_FEATURE_KEY };
