def evaluate(state):
    slices = max(1, len(state.get("ordered_plan", [])))
    state["receipts"].append({"layer": "autonomous_runtime_v5", "slices": slices})
    state["slices"] = slices
    return state