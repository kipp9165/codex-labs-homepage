def evaluate(state):
    escalate = not all(
        [
            state.get("normalized", False),
            state.get("role_allowed", False),
            state.get("domains_ok", False),
            state.get("within_budget", False),
            state.get("compliant", False),
            state.get("safe", False),
        ]
    )
    state["receipts"].append({"layer": "governance_v7", "escalate": escalate})
    state["escalate"] = escalate
    return state
