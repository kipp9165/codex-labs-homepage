def evaluate(state):
    lock_key = "|".join(str(action.get("id", "")) for action in state["actions"])
    state["receipts"].append({"layer": "governance_v8", "replay_lock": lock_key})
    state["replay_lock"] = lock_key
    return state
