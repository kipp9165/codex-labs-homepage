def evaluate(state):
    confidences = [float(action.get("confidence", 1.0)) for action in state["actions"]]
    slope = 0.0
    if len(confidences) > 1:
        slope = confidences[-1] - confidences[0]
    state["receipts"].append({"layer": "drift_engine_v4", "confidence_slope": slope})
    state["confidence_slope"] = slope
    return state