import json

def interpret_drift(receipt_path):
    with open(receipt_path, "r") as f:
        drift = json.load(f)

    raw = drift["raw_action"]
    delta = drift["delta"]

    summary = {
        "drift_id": drift["drift_id"],
        "path": raw["path"],
        "operation": raw["operation"],
        "risk_change": delta.get("risk_class", None),
        "prior_disposition": drift["prior_disposition"],
        "new_disposition": drift["new_disposition"],
        "explanation": (
            f"Risk class changed from {drift['prior_envelope']['risk_class']} "
            f"to {drift['new_envelope']['risk_class']}, disposition remained "
            f"{drift['new_disposition']}."
        )
    }

    return summary
