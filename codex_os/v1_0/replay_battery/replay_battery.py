"""Replay Battery."""

def run_replay_battery(raw_actions, governance_state):
    ordered = sorted(raw_actions, key=lambda item: str(item.get("id", "")))
    envelopes = []
    for action in ordered:
        envelopes.append(
            {
                "id": action.get("id"),
                "type": action.get("type", "unknown"),
                "domain": action.get("domain", "core"),
                "governance_disposition": governance_state.get("disposition", "REVIEW"),
            }
        )
    return {
        "envelopes": envelopes,
        "count": len(envelopes),
    }