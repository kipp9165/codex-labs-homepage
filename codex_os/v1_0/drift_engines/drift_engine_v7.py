def evaluate(state):
    replay_divergence = state.get("skew", 0) % 3
    state["receipts"].append({"layer": "drift_engine_v7", "replay_divergence": replay_divergence})
    state["replay_divergence"] = replay_divergence
    return state