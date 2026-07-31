def evaluate(state):
    ordered = sorted(state.get("plan", []))
    state["receipts"].append({"layer": "autonomous_runtime_v3", "ordered": True})
    state["ordered_plan"] = ordered
    return state