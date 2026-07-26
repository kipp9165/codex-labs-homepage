from codex_os.codex.replay.src.envelope_validator import validate_envelope


def classify(raw_action: dict) -> dict:
    """
    Convert a raw action into a governance envelope.
    This is the layer that can drift.
    """
    path = raw_action["path"]

    if path.startswith("/secrets"):
        surface = "secrets"
    elif path.startswith("/system"):
        surface = "system"
    elif path.startswith("/logs"):
        surface = "logs"
    else:
        surface = "project"

    op = raw_action["operation"]
    if op in ("read", "list"):
        operation_class = "read"
    elif op in ("write", "delete"):
        operation_class = "write"
    else:
        operation_class = "execute"

    if surface == "secrets":
        risk_class = "high"
    elif surface == "system":
        risk_class = "high"
    elif surface == "logs":
        risk_class = "low"
    else:
        risk_class = "low"

    if operation_class == "write" or op == "delete":
        irreversibility = "irreversible"
    else:
        irreversibility = "reversible"

    validate_envelope(
        {
            "surface": surface,
            "operation_class": operation_class,
            "risk_class": risk_class,
            "irreversibility": irreversibility,
        }
    )

    return {
        "surface": surface,
        "operation_class": operation_class,
        "risk_class": risk_class,
        "irreversibility": irreversibility,
    }