def evaluate(state):
    plan = ["exec:" + str(item) for item in state.get("queue", [])]
    state["receipts"].append({"layer": "autonomous_runtime_v2", "plan_size": len(plan)})
    state["plan"] = plan
    return state