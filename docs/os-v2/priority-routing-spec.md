# Codex Labs OS v2.0 — Priority Routing Specification

## Purpose
The Priority Routing Specification defines how all operations, requests, and signals are routed across Codex Labs OS v2.0 surfaces in priority order. It ensures that high-authority operations receive unconditional precedence.

## Spec Metadata

```json
{
  "spec-version": "v2.0-final",
  "routing-model": "priority-weighted",
  "founder-priority": "unconditional",
  "preemption-policy": "enabled",
  "queue-model": "strict-priority",
  "founder-grade": true
}
```

## Priority Levels

| Priority | Class | Description |
|----------|-------|-------------|
| P0 | Founder | Unconditional. All other operations yield immediately. |
| P1 | Constitutional | Substrate and governance operations. |
| P2 | Sovereign Operator | Whale-tier and sovereign surface operations. |
| P3 | Enterprise | Enterprise-tier operational requests. |
| P4 | Founder Member | Founder member surface requests. |
| P5 | Affiliate | Affiliate routing requests. |
| P6 | Public | General public surface requests. |

## Routing Rules

### R-1: Preemption
P0 operations preempt all active P1–P6 operations immediately. Preempted operations are queued for resumption after P0 completion.

### R-2: Starvation Prevention
P3–P6 operations may not be indefinitely starved. Governance enforces a maximum wait ceiling per tier.

### R-3: Whale-Tier SLA
Whale-tier (P2) operations are guaranteed a response within the contracted SLA window, regardless of queue depth.

### R-4: Governance Routing
All governance operations are routed at P1. No P2–P6 operation may delay a governance operation.

### R-5: Founder Override
The Founder may re-route any operation to P0 at any time.

END PRIORITY ROUTING SPECIFICATION.
