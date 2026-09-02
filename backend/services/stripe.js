import { getWhaleTierAccessState } from "../entitlements/checkWhaleTier.js";

export async function verifyWhaleTier(customerId, runtimeConfig) {
  const entitlementState = await getWhaleTierAccessState(customerId, {}, runtimeConfig);
  return {
    whale: entitlementState.hasWhaleTier,
    customerId: entitlementState.customerId,
    detail: entitlementState.detail,
  };
}
