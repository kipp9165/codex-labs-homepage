def evaluate(state):
    gated = state.get("governance_disposition") == "APPROVE"
    state["receipts"].append({"layer": "autonomous_runtime_v4", "capability_gate": gated})
    state["capability_gate"] = gated
    return state