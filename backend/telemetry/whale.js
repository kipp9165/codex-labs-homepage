function emitWhaleTelemetry(message, context = {}) {
  console.log(JSON.stringify({
    ts: new Date().toISOString(),
    scope: "whale_tier",
    message,
    ...context,
  }));
}

export function logWhaleEntitlementStatus(status) {
  emitWhaleTelemetry("entitlement_status", {
    customer_id: status.customerId || "",
    has_whale_tier: Boolean(status.hasWhaleTier),
    entitlement_lookup_keys: status.matchedEntitlements?.map((entitlement) => entitlement.lookupKey || entitlement.featureLookupKey).filter(Boolean) || [],
    subscription_id: status.subscription?.id || "",
    subscription_status: status.subscription?.status || "",
    detail: status.detail || "",
  });
}

export function logWhaleRoutingDecision({
  customerId = "",
  hasWhaleTier = false,
  domain = "",
  admissibility = "",
  whalePriority = false,
  routePath = "",
  canonicalReferences = [],
} = {}) {
  emitWhaleTelemetry("routing_decision", {
    customer_id: customerId,
    has_whale_tier: hasWhaleTier,
    domain,
    admissibility,
    whale_priority: whalePriority,
    route_path: routePath,
    canonical_references: canonicalReferences,
  });
}

export function logWhaleAdmissibilityBoundary({
  customerId = "",
  hasWhaleTier = false,
  boundaryClassification = "",
  missionCriticalBoundary = false,
  admissibilityScore = 0,
  domain = "",
} = {}) {
  emitWhaleTelemetry("admissibility_boundary", {
    customer_id: customerId,
    has_whale_tier: hasWhaleTier,
    boundary_classification: boundaryClassification,
    mission_critical_boundary: missionCriticalBoundary,
    admissibility_score: admissibilityScore,
    domain,
  });
}
