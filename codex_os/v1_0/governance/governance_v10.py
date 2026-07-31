def evaluate(state):
    approved = all(
        [
            state.get("normalized", False),
            state.get("role_allowed", False),
            state.get("domains_ok", False),
            state.get("within_budget", False),
            state.get("compliant", False),
            state.get("safe", False),
            state.get("confidence_ok", False),
        ]
    )
    disposition = "APPROVE" if approved and not state.get("escalate", False) else "REVIEW"
    state["receipts"].append({"layer": "governance_v10", "disposition": disposition})
    state["disposition"] = disposition
    return state
