def evaluate(state):
    checkpoints = ["cp:" + str(index) for index in range(state.get("slices", 1))]
    state["receipts"].append({"layer": "autonomous_runtime_v7", "checkpoints": len(checkpoints)})
    state["checkpoints"] = checkpoints
    return state