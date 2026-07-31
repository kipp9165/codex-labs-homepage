def evaluate(state):
    route_mutation = any("route" in action and "->" in str(action.get("route")) for action in state["actions"])
    state["receipts"].append({"layer": "drift_engine_v6", "route_mutation": route_mutation})
    state["route_mutation"] = route_mutation
    return state