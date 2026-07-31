def evaluate(state):
    compliance_required = bool(state["policy_context"].get("compliance_required", False))
    actions = state["actions"]
    compliant = all(action.get("compliance", True) for action in actions) if compliance_required else True
    state["receipts"].append({"layer": "governance_v5", "compliant": compliant})
    state["compliant"] = compliant
    return state
