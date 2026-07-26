from codex_os.codex.replay.src.module_registry import get_module
from codex_os.codex.replay.src.client_registry import get_client_module

def run_substrate(raw_actions):
    replay = get_module("replay")
    drift = get_module("drift")
    governance = get_module("governance")

    envelopes = replay(raw_actions)
    drift_state = drift()
    gov = [governance(env) for env in envelopes]

    return {
        "envelopes": envelopes,
        "governance": gov,
        "drift": drift_state
    }

def run_client_substrate(raw_actions):
    client_full = get_client_module("client_full")
    return client_full(raw_actions)