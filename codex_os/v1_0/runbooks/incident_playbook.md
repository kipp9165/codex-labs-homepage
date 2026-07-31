# Incident Playbook

## Trigger Conditions

1. Drift disposition is `DRIFT_ALERT`.
2. Stability status is `UNSTABLE`.
3. Authenticity disposition is `INAUTHENTIC`.

## Response Flow

1. Freeze execution lanes.
2. Re-run replay battery and verification.
3. Require founder override for business, deals, partnerships, collaborations, money, and sensitive strategic actions.
4. Emit crisis disposition and route to escalation owner.
