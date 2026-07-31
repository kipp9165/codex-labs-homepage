def evaluate(state):
    budget_cap = float(state["policy_context"].get("budget_cap", 0.0))
    requested = sum(float(action.get("amount", 0.0)) for action in state["actions"])
    within_budget = requested <= budget_cap if budget_cap > 0 else True
    state["receipts"].append({"layer": "governance_v4", "within_budget": within_budget})
    state["within_budget"] = within_budget
    return state
