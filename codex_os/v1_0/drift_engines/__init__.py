"""Drift Engines v1-v11 stack."""

from codex_os.v1_0.drift_engines.drift_engine_v1 import evaluate as drift_v1
from codex_os.v1_0.drift_engines.drift_engine_v2 import evaluate as drift_v2
from codex_os.v1_0.drift_engines.drift_engine_v3 import evaluate as drift_v3
from codex_os.v1_0.drift_engines.drift_engine_v4 import evaluate as drift_v4
from codex_os.v1_0.drift_engines.drift_engine_v5 import evaluate as drift_v5
from codex_os.v1_0.drift_engines.drift_engine_v6 import evaluate as drift_v6
from codex_os.v1_0.drift_engines.drift_engine_v7 import evaluate as drift_v7
from codex_os.v1_0.drift_engines.drift_engine_v8 import evaluate as drift_v8
from codex_os.v1_0.drift_engines.drift_engine_v9 import evaluate as drift_v9
from codex_os.v1_0.drift_engines.drift_engine_v10 import evaluate as drift_v10
from codex_os.v1_0.drift_engines.drift_engine_v11 import evaluate as drift_v11


def run_drift_stack(raw_actions, governance_state):
    state = {
        "actions": sorted(raw_actions, key=lambda item: str(item.get("id", ""))),
        "governance_disposition": governance_state.get("disposition", "REVIEW"),
        "receipts": [],
    }
    for layer in [
        drift_v1,
        drift_v2,
        drift_v3,
        drift_v4,
        drift_v5,
        drift_v6,
        drift_v7,
        drift_v8,
        drift_v9,
        drift_v10,
        drift_v11,
    ]:
        state = layer(state)
    return state