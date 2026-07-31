"""Autonomous Runtime v1-v10 stack."""

from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v1 import evaluate as runtime_v1
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v2 import evaluate as runtime_v2
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v3 import evaluate as runtime_v3
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v4 import evaluate as runtime_v4
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v5 import evaluate as runtime_v5
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v6 import evaluate as runtime_v6
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v7 import evaluate as runtime_v7
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v8 import evaluate as runtime_v8
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v9 import evaluate as runtime_v9
from codex_os.v1_0.autonomous_runtime.autonomous_runtime_v10 import evaluate as runtime_v10


def run_autonomous_runtime_stack(raw_actions, governance_state):
    state = {
        "actions": sorted(raw_actions, key=lambda item: str(item.get("id", ""))),
        "governance_disposition": governance_state.get("disposition", "REVIEW"),
        "receipts": [],
    }
    for layer in [
        runtime_v1,
        runtime_v2,
        runtime_v3,
        runtime_v4,
        runtime_v5,
        runtime_v6,
        runtime_v7,
        runtime_v8,
        runtime_v9,
        runtime_v10,
    ]:
        state = layer(state)
    return state