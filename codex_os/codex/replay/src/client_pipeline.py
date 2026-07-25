from replay_api import run_replay
from drift_api import get_drift_state
from governance_api import apply_governance

def build_client_replay_bundle(raw_actions):
    envelopes = run_replay(raw_actions)
    gov = [apply_governance(env) for env in envelopes]
    return {
        "envelopes": envelopes,
        "governance": gov
    }

def build_client_drift_bundle():
    return get_drift_state()

def build_client_full_bundle(raw_actions):
    replay_bundle = build_client_replay_bundle(raw_actions)
    drift_bundle = build_client_drift_bundle()
    return {
        "replay": replay_bundle,
        "drift": drift_bundle
    }