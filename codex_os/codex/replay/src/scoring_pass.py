def score(envelope: dict) -> dict:
    """
    Apply Codex's fixed threshold table to produce a disposition.
    """
    surface = envelope["surface"]
    risk = envelope["risk_class"]
    irreversible = envelope["irreversibility"]
    op_class = envelope["operation_class"]

    if surface == "secrets" and op_class == "write":
        return {"decision": "DENY", "reason": "write to secrets"}

    if risk == "critical":
        return {"decision": "DENY", "reason": "critical risk"}

    if irreversible == "irreversible" and risk in ("high", "medium"):
        return {"decision": "DENY", "reason": "irreversible elevated risk"}

    return {"decision": "ALLOW", "reason": "meets thresholds"}