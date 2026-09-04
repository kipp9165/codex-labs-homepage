// backend/entitlements/checkWhaleTier.ts

import { createStripeClient, resolveStripeSecretKey } from "../stripeClient.js";

const { sanitizedKey: stripeSecretKey, validationError: stripeSecretKeyError } = resolveStripeSecretKey(
  process.env.STRIPE_SECRET_KEY,
);
const stripe = stripeSecretKeyError
  ? null
  : createStripeClient(stripeSecretKey, {
      apiVersion: "2024-06-20",
    });
const WHALE_TIER_FEATURE_KEY = "whale_tier_access";

function normalizeString(value: string | undefined | null): string {
  return typeof value === "string" ? value.trim() : "";
}

type ActiveEntitlement = Awaited<
  ReturnType<NonNullable<typeof stripe>["entitlements"]["activeEntitlements"]["list"]>
>["data"][number];

async function listAllActiveEntitlements(customerId: string) {
  const entitlements: { data: ActiveEntitlement[] } = { data: [] };

  for await (const entitlement of stripe.entitlements.activeEntitlements.list({
    customer: customerId,
  })) {
    entitlements.data.push(entitlement);
  }

  return entitlements;
}

/**
 * Canonical Whale-Tier entitlement check.
 * - Reads Stripe entitlements for a given customer
 * - Returns true only if whale_tier_access is active
 */
export async function checkWhaleTier(
  customerId: string,
  featureKey: string = WHALE_TIER_FEATURE_KEY,
): Promise<boolean> {
  if (stripeSecretKeyError || !stripe) {
    console.error("[WhaleTier]", stripeSecretKeyError ?? "Missing STRIPE_SECRET_KEY");
    return false;
  }

  if (!customerId) {
    console.error("[WhaleTier] Missing customerId");
    return false;
  }

  try {
    const normalizedFeatureKey = normalizeString(featureKey) || WHALE_TIER_FEATURE_KEY;
    const entitlements = await listAllActiveEntitlements(customerId);

    const hasWhaleTier = entitlements.data.some(
      (entitlement) => entitlement.lookup_key === normalizedFeatureKey,
    );

    console.log(
      `[WhaleTier] customer=${customerId} hasWhaleTier=${hasWhaleTier}`,
    );

    return hasWhaleTier;
  } catch (err) {
    console.error("[WhaleTier] Error fetching entitlements", err);
    return false;
  }
}
