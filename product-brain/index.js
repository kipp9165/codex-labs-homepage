const ENTITLEMENT_MAP = {
  "codex-labs-os": ["access:codex-labs-os", "access:basic"],
  "premium-bundle": ["access:premium", "access:basic"],
  "basic-access": ["access:basic"],
  "execution-stabilization-system": ["access:execution-stabilization-system", "access:basic"],
  "operational-sovereignty": ["access:operational-sovereignty", "access:basic"],
  "structural-integrity": ["access:structural-integrity", "access:basic"],
};

export function resolveEntitlements(products) {
  return products.flatMap((p) => ENTITLEMENT_MAP[p] || []);
}
