def evaluate(state):
    cluster_score = state.get("policy_entropy", 0) + int(state.get("route_mutation", False))
    state["receipts"].append({"layer": "drift_engine_v9", "cluster_score": cluster_score})
    state["cluster_score"] = cluster_score
    return state