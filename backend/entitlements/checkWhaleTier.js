import config from "../config.js";
import { createStripeClient } from "../stripeClient.js";

const STRIPE_API_VERSION = "2024-06-20";
const WHALE_TIER_FEATURE_KEY = "whale_tier_access";

function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

function createResolvedStripeClient(runtimeConfig = config) {
  if (runtimeConfig.stripeSecretKeyError || !runtimeConfig.stripeSecretKey) {
    return null;
  }

  return createStripeClient(runtimeConfig.stripeSecretKey, { apiVersion: STRIPE_API_VERSION });
}

function getStripeConfigurationDetail(runtimeConfig = config) {
  return runtimeConfig.stripeSecretKeyError || "stripe_not_configured";
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
} = {}, runtimeConfig = config, stripeClient = createResolvedStripeClient(runtimeConfig)) {
  const normalizedCustomerId = normalizeString(customerId);
  if (normalizedCustomerId.startsWith("cus_")) {
    return normalizedCustomerId;
  }

  if (!stripeClient) {
    return "";
  }

  const normalizedSubscriptionId = normalizeString(subscriptionId);
  if (normalizedSubscriptionId.startsWith("sub_")) {
    try {
      const subscriptionCustomerId = await retrieveSubscriptionCustomerId(stripeClient, normalizedSubscriptionId);
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
      const customers = await stripeClient.customers.list({ email: candidate, limit: 1 });
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
  stripeClient = createResolvedStripeClient(runtimeConfig),
) {
  const normalizedCustomerId = normalizeString(customerId);
  const normalizedRequestedFeatureKey = normalizeString(featureKey);
  const normalizedFeatureKey = normalizedRequestedFeatureKey || WHALE_TIER_FEATURE_KEY;
  if (!normalizedRequestedFeatureKey) {
    console.log("[WhaleTier] Short-circuit: missing featureKey, using fallback", {
      featureKey,
      fallbackFeatureKey: normalizedFeatureKey,
      customerId: normalizedCustomerId,
    });
  }
  if (!stripeClient) {
    console.log("[WhaleTier] Short-circuit: stripeKey missing", {
      customerId: normalizedCustomerId,
      featureKey: normalizedFeatureKey,
      stripeKeyPresent: Boolean(runtimeConfig?.stripeSecretKey),
      stripeKeyEnvPresent: Boolean(process.env.STRIPE_SECRET_KEY),
      detail: getStripeConfigurationDetail(runtimeConfig),
    });
    console.error("[WhaleTier]", getStripeConfigurationDetail(runtimeConfig));
    return {
      hasWhaleTier: false,
      customerId: normalizedCustomerId,
      entitlement_lookup_keys: [],
      matchedEntitlements: [],
      subscription: null,
      detail: getStripeConfigurationDetail(runtimeConfig),
    };
  }

  if (!normalizedCustomerId) {
    console.log("[WhaleTier] Short-circuit: missing customerId", {
      customerId,
      featureKey: normalizedFeatureKey,
    });
    console.error("[WhaleTier] Missing customerId");
    return {
      hasWhaleTier: false,
      customerId: "",
      entitlement_lookup_keys: [],
      matchedEntitlements: [],
      subscription: null,
      detail: "missing_customer_id",
    };
  }

  try {
    console.log("[WhaleTier] Calling ActiveEntitlements.list()", {
      customerId: normalizedCustomerId,
      featureKey: normalizedFeatureKey,
      stripeKeyPresent: Boolean(runtimeConfig?.stripeSecretKey),
      stripeKeyEnvPresent: Boolean(process.env.STRIPE_SECRET_KEY),
    });
    const entitlements = await stripeClient.entitlements.activeEntitlements.list({
      customer: normalizedCustomerId,
    });

    const entitlementLookupKeys = entitlements.data
      .map((entitlement) => entitlement.lookup_key)
      .filter(Boolean);
    const hasWhaleTier = entitlements.data.some(
      (entitlement) => entitlement.lookup_key === normalizedFeatureKey,
    );
    const matchedEntitlements = entitlements.data
      .filter((entitlement) => entitlement.lookup_key === normalizedFeatureKey)
      .map(summarizeEntitlement);
    const subscription = await resolveSubscriptionSummary(stripeClient, normalizedCustomerId, subscriptionId);

    console.log(
      `[WhaleTier] customer=${normalizedCustomerId} hasWhaleTier=${hasWhaleTier} entitlementCount=${matchedEntitlements.length}`,
    );

    return {
      hasWhaleTier,
      customerId: normalizedCustomerId,
      entitlement_lookup_keys: entitlementLookupKeys,
      matchedEntitlements,
      subscription,
      detail: "entitlements_checked",
    };
  } catch (error) {
    console.error("[WhaleTier] Error fetching entitlements", error);
    return {
      hasWhaleTier: false,
      customerId: normalizedCustomerId,
      entitlement_lookup_keys: [],
      matchedEntitlements: [],
      subscription: null,
      detail: error instanceof Error ? error.message : "whale_tier_lookup_failed",
    };
  }
}

export async function resolveWhaleTierAccessState(
  accessContext = {},
  { featureKey = WHALE_TIER_FEATURE_KEY } = {},
  runtimeConfig = config,
) {
  const stripeClient = createResolvedStripeClient(runtimeConfig);
  const resolvedCustomerId = await resolveStripeCustomerId(accessContext, runtimeConfig, stripeClient);
  return getWhaleTierAccessState(
    resolvedCustomerId,
    {
      subscriptionId: accessContext.subscriptionId,
      featureKey,
    },
    runtimeConfig,
    stripeClient,
  );
}

export async function checkWhaleTier(
  customerId,
  featureKey = WHALE_TIER_FEATURE_KEY,
  runtimeConfig = config,
) {
  const normalizedCustomerId = normalizeString(customerId);
  const normalizedFeatureKey = normalizeString(featureKey);
  const userTier = runtimeConfig?.userTier || "unknown";
  console.log("[WhaleTier] Starting entitlement check", {
    customerId: normalizedCustomerId,
    featureKey: normalizedFeatureKey || WHALE_TIER_FEATURE_KEY,
    userTier,
    stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
  });

  if (!normalizedCustomerId) {
    console.log("[WhaleTier] Short-circuit: missing customerId", {
      customerId,
      featureKey: normalizedFeatureKey || WHALE_TIER_FEATURE_KEY,
      userTier,
    });
  }

  if (!normalizedFeatureKey) {
    console.log("[WhaleTier] Short-circuit: missing featureKey, using fallback block", {
      featureKey,
      fallbackFeatureKey: WHALE_TIER_FEATURE_KEY,
      userTier,
    });
  }

  if (!runtimeConfig?.stripeSecretKey) {
    console.log("[WhaleTier] Short-circuit: stripeKey missing", {
      customerId: normalizedCustomerId,
      featureKey: normalizedFeatureKey || WHALE_TIER_FEATURE_KEY,
      userTier,
      stripeKeyPresent: !!process.env.STRIPE_SECRET_KEY,
    });
  }

  const entitlementState = await getWhaleTierAccessState(
    customerId,
    { featureKey },
    runtimeConfig,
  );
  if (!entitlementState.hasWhaleTier) {
    console.log("[WhaleTier] Short-circuit: cached false / user_tier mismatch / fallback block", {
      customerId: entitlementState.customerId || normalizedCustomerId,
      featureKey: normalizedFeatureKey || WHALE_TIER_FEATURE_KEY,
      userTier,
      detail: entitlementState.detail,
    });
  }
  return entitlementState.hasWhaleTier;
}

export { WHALE_TIER_FEATURE_KEY };
