def evaluate(state):
    policy_entropy = len({action.get("domain", "core") for action in state["actions"]})
    state["receipts"].append({"layer": "drift_engine_v5", "policy_entropy": policy_entropy})
    state["policy_entropy"] = policy_entropy
    return state