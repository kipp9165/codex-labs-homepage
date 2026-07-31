def evaluate(state):
    disposition = "RUNTIME_GO" if state.get("stabilized", False) else "RUNTIME_HOLD"
    state["receipts"].append({"layer": "autonomous_runtime_v10", "disposition": disposition})
    state["disposition"] = disposition
    return state