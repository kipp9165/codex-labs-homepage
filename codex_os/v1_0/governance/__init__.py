"""Governance v1-v10 stack."""

from codex_os.v1_0.governance.governance_v1 import evaluate as governance_v1
from codex_os.v1_0.governance.governance_v2 import evaluate as governance_v2
from codex_os.v1_0.governance.governance_v3 import evaluate as governance_v3
from codex_os.v1_0.governance.governance_v4 import evaluate as governance_v4
from codex_os.v1_0.governance.governance_v5 import evaluate as governance_v5
from codex_os.v1_0.governance.governance_v6 import evaluate as governance_v6
from codex_os.v1_0.governance.governance_v7 import evaluate as governance_v7
from codex_os.v1_0.governance.governance_v8 import evaluate as governance_v8
from codex_os.v1_0.governance.governance_v9 import evaluate as governance_v9
from codex_os.v1_0.governance.governance_v10 import evaluate as governance_v10


def run_governance_stack(raw_actions, policy_context):
    layers = [
        governance_v1,
        governance_v2,
        governance_v3,
        governance_v4,
        governance_v5,
        governance_v6,
        governance_v7,
        governance_v8,
        governance_v9,
        governance_v10,
    ]
    state = {
        "policy_context": policy_context,
        "actions": sorted(raw_actions, key=lambda item: str(item.get("id", ""))),
        "receipts": [],
    }
    for layer in layers:
        state = layer(state)
    return state
