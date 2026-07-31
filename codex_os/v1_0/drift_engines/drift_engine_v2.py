def evaluate(state):
    skew = sum(len(str(action.get("type", ""))) for action in state["actions"])
    state["receipts"].append({"layer": "drift_engine_v2", "skew": skew})
    state["skew"] = skew
    return state