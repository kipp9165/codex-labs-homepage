def evaluate(state):
    severity = state.get("cluster_score", 0) + state.get("replay_divergence", 0)
    state["receipts"].append({"layer": "drift_engine_v10", "severity": severity})
    state["severity"] = severity
    return state