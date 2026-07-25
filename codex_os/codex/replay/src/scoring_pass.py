def score_envelope(env):
    risk = env["risk_class"]
    op = env["operation_class"]

    if risk == "critical":
        return 100
    if risk == "high" and op == "write":
        return 80
    if risk == "high" and op == "execute":
        return 60
    if risk == "low":
        return 20

    return 40