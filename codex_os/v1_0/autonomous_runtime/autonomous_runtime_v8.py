def evaluate(state):
    health = 100 - (0 if state.get("capability_gate", False) else 20)
    state["receipts"].append({"layer": "autonomous_runtime_v8", "health": health})
    state["health"] = health
    return state