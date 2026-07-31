def evaluate(state):
    disposition = "DRIFT_ALERT" if state.get("severity", 0) >= 3 else "DRIFT_STABLE"
    state["receipts"].append({"layer": "drift_engine_v11", "disposition": disposition})
    state["disposition"] = disposition
    return state