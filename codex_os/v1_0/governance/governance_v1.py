def evaluate(state):
    actions = state["actions"]
    valid = all("type" in action for action in actions)
    state["receipts"].append({"layer": "governance_v1", "normalized": valid})
    state["normalized"] = valid
    return state
