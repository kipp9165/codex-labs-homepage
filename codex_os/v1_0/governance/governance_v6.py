def evaluate(state):
    risk_scores = [int(action.get("risk", 0)) for action in state["actions"]]
    max_risk = max(risk_scores) if risk_scores else 0
    safe = max_risk <= int(state["policy_context"].get("max_risk", 10))
    state["receipts"].append({"layer": "governance_v6", "safe": safe, "max_risk": max_risk})
    state["safe"] = safe
    return state
