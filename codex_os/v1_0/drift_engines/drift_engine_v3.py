def evaluate(state):
    mismatch = state.get("governance_disposition") != "APPROVE"
    state["receipts"].append({"layer": "drift_engine_v3", "mismatch": mismatch})
    state["mismatch"] = mismatch
    return state