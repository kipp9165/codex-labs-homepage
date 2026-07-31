def evaluate(state):
    queue = [action.get("id", index) for index, action in enumerate(state["actions"])]
    state["receipts"].append({"layer": "autonomous_runtime_v1", "queue": queue})
    state["queue"] = queue
    return state