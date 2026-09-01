# Codex Labs OS v2.0 — Entitlements Layer

## Purpose
The Entitlements Layer defines all access rights, privileges, and operational permissions across every tier of Codex Labs OS v2.0. It is the canonical authority for determining what any party may read, write, execute, or govern.

## Layer Metadata

```json
{
  "spec-version": "v2.0-final",
  "entitlement-model": "hierarchical",
  "default-policy": "deny",
  "founder-override": true,
  "tier-locked": true,
  "additive-only": true,
  "founder-grade": true
}
```

## Entitlement Tiers

### Tier 0 — Founder
- Full read/write/execute across all layers
- Constitutional amendment authority
- Layer creation and dissolution rights
- Unconditional priority routing
- All Tier 1–5 entitlements included

### Tier 1 — Sovereign Operator
- Full read across all non-constitutional layers
- Write authority on assigned operational surfaces
- Governance participation rights
- Priority routing on sovereign surfaces

### Tier 2 — Whale Enterprise
- Full read on enterprise surfaces
- Write authority on contracted surfaces
- Entitlement grant authority within Tier 3–5

### Tier 3 — Founder Member
- Read on public and founder surfaces
- Write on personal execution surfaces
- Scroll access and library rights

### Tier 4 — Affiliate
- Read on public surfaces
- Commission and referral rights
- Limited scroll access

### Tier 5 — Public
- Read on public surfaces only
- No write or execute rights

## Entitlement Grants
All entitlement grants above Tier 5 must be explicitly authorized by a party with authority at or above the requested tier, or by the Founder.

END ENTITLEMENTS LAYER.
