def build_governance_envelope(env):
    surface = env["surface"]
    risk = env["risk_class"]
    op = env["operation_class"]

    layer = "governance"

    if surface == "secrets":
        domain = "security"
    elif surface == "system":
        domain = "infrastructure"
    elif surface == "logs":
        domain = "observability"
    else:
        domain = "general"

    return {
        "layer": layer,
        "domain": domain,
        "surface": surface,
        "risk_class": risk,
        "operation_class": op,
        "irreversibility": env["irreversibility"],
    }