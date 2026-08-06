# Codex OS v1.0 — API Reference

## Entry Point

### `build_codex_os_v1_snapshot(raw_actions, policy_context, product_seed)`

Builds a deterministic full-system snapshot.

#### Parameters

- `raw_actions`: list of action objects  
  - `id`: stable identifier  
  - `type`: action type  
  - `domain`: domain label  
  - optional: `amount`, `risk`, `confidence`, `route`, `compliance`

- `policy_context`: dict  
  - `operator_role`: `"founder" | "operator" | "steward" | "unknown"`  
  - `allowed_domains`: list of domains  
  - `budget_cap`: numeric  
  - `compliance_required`: bool  
  - `max_risk`: int  
  - `confidence_floor`: float  
  - `founder_present`: bool

- `product_seed`: string or numeric seed for product minting.

#### Return value

A dict with keys:

- `codex_os_version`
- `substrate`
- `governance`
- `drift_engines`
- `autonomous_runtime`
- `runtime_orchestration_engine`
- `stability_engine`
- `replay_battery`
- `qa_device`
- `codex_q_a_v2_0`
- `simulation_layer`
- `crisis_simulation`
- `founder_override_layer`
- `codex_commerce_v1_0`
- `codex_product_generator`
- `stripe_mint_remint_engine`
- `codex_product_registry`
- `trust_root_v1_0`
- `receipt_verification_v2_0`
- `codex_authenticity_engine`
- `codex_provenance_chain`

Each sub-object is deterministic and recomputable.

## Example

```python
from codex_os.v1_0.system import build_codex_os_v1_snapshot

snapshot = build_codex_os_v1_snapshot(
    raw_actions=[
        {"id": "a1", "type": "payment", "domain": "commerce", "amount": 100.0, "risk": 2, "confidence": 0.95},
        {"id": "a2", "type": "access", "domain": "runtime", "risk": 1, "confidence": 0.99},
    ],
    policy_context={
        "operator_role": "founder",
        "allowed_domains": ["commerce", "runtime"],
        "budget_cap": 1000.0,
        "compliance_required": True,
        "max_risk": 5,
        "confidence_floor": 0.8,
        "founder_present": True,
    },
    product_seed="founder-edition",
)
print(snapshot["codex_os_version"])
```