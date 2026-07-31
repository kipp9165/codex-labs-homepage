def evaluate(state):
    latency_band = "stable" if state.get("signal_count", 0) <= 25 else "elevated"
    state["receipts"].append({"layer": "drift_engine_v8", "latency_band": latency_band})
    state["latency_band"] = latency_band
    return state