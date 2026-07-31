def evaluate(state):
    signal_count = len(state["actions"])
    state["receipts"].append({"layer": "drift_engine_v1", "signal_count": signal_count})
    state["signal_count"] = signal_count
    return state