def compute_governance_disposition(gov_env):
    risk = gov_env["risk_class"]
    domain = gov_env["domain"]

    if risk == "critical":
        return "ESCALATE"
    if risk == "high" and domain in ["security", "infrastructure"]:
        return "REVIEW"
    if risk == "low":
        return "LOG"

    return "REVIEW"