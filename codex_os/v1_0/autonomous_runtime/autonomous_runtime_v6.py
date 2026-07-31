def evaluate(state):
    fallback_ready = not state.get("capability_gate", False)
    state["receipts"].append({"layer": "autonomous_runtime_v6", "fallback_ready": fallback_ready})
    state["fallback_ready"] = fallback_ready
    return state