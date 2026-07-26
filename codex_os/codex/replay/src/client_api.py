from codex_os.codex.replay.src.client_pipeline import (
    build_client_replay_bundle,
    build_client_drift_bundle,
    build_client_full_bundle
)

def client_replay(raw_actions):
    return build_client_replay_bundle(raw_actions)

def client_drift():
    return build_client_drift_bundle()

def client_full(raw_actions):
    return build_client_full_bundle(raw_actions)