def evaluate(state):
    role = state["policy_context"].get("operator_role", "unknown")
    allowed = role in {"founder", "operator", "steward"}
    state["receipts"].append({"layer": "governance_v2", "role_allowed": allowed})
    state["role_allowed"] = allowed
    return state
