// backend/entitlements/checkWhaleTier.ts

import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: "2024-06-20",
});

/**
 * Canonical Whale-Tier entitlement check.
 * - Reads Stripe entitlements for a given customer
 * - Returns true only if whale_tier_access is active
 */
export async function checkWhaleTier(customerId: string): Promise<boolean> {
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error("[WhaleTier] Missing STRIPE_SECRET_KEY");
    return false;
  }

  if (!customerId) {
    console.error("[WhaleTier] Missing customerId");
    return false;
  }

  try {
    const entitlements = await stripe.entitlements.activeEntitlements.list({
      customer: customerId,
      expand: ["data.feature"],
      limit: 100,
    });

    const hasWhaleTier = entitlements.data.some((entitlement) => {
      const featureId = typeof entitlement.feature === "string"
        ? entitlement.feature
        : entitlement.feature?.id;

      const featureLookupKey = typeof entitlement.feature === "string"
        ? undefined
        : entitlement.feature?.lookup_key;

      return (
        featureId === "whale_tier_access"
        || featureLookupKey === "whale_tier_access"
      );
    });

    console.log(
      `[WhaleTier] customer=${customerId} hasWhaleTier=${hasWhaleTier}`,
    );

    return hasWhaleTier;
  } catch (err) {
    console.error("[WhaleTier] Error fetching entitlements", err);
    return false;
  }
}
