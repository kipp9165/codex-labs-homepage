import json

def summarize_receipts(receipts_dir):
    summaries = []
    for receipt_path in receipts_dir.glob("drift_*.json"):
        with open(receipt_path, "r") as f:
            drift = json.load(f)

        summaries.append({
            "drift_id": drift["drift_id"],
            "path": drift["raw_action"]["path"],
            "risk_delta": drift["delta"].get("risk_class"),
            "prior_disposition": drift["prior_disposition"],
            "new_disposition": drift["new_disposition"]
        })

    return summaries