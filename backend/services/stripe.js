import { getWhaleTierAccessState, WHALE_TIER_FEATURE_KEY } from "../entitlements/checkWhaleTier.js";

export async function verifyWhaleTier(customerId, runtimeConfig) {
  const entitlementState = await getWhaleTierAccessState(
    customerId,
    { featureKey: WHALE_TIER_FEATURE_KEY },
    runtimeConfig,
  );
  return {
    whale: entitlementState.hasWhaleTier,
    customerId: entitlementState.customerId,
    detail: entitlementState.detail,
  };
}
