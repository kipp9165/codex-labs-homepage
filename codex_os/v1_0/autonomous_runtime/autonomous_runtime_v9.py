def evaluate(state):
    stabilized = state.get("health", 0) >= 70
    state["receipts"].append({"layer": "autonomous_runtime_v9", "stabilized": stabilized})
    state["stabilized"] = stabilized
    return state