def evaluate(state):
    confidence_floor = float(state["policy_context"].get("confidence_floor", 0.0))
    confidences = [float(action.get("confidence", 1.0)) for action in state["actions"]]
    confidence_ok = all(value >= confidence_floor for value in confidences)
    state["receipts"].append({"layer": "governance_v9", "confidence_ok": confidence_ok})
    state["confidence_ok"] = confidence_ok
    return state
