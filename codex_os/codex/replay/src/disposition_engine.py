def compute_disposition(envelope):
    risk = envelope["risk_class"]
    op = envelope["operation_class"]

    if risk == "critical":
        return "DENY"
    if risk == "high" and op == "write":
        return "DENY"
    if risk == "high" and op == "execute":
        return "REVIEW"
    if risk == "low":
        return "ALLOW"

    return "REVIEW"
