import json
import uuid
from datetime import datetime
from pathlib import Path

RUNS_DIR = Path(__file__).parent.parent / "runs"
RECEIPTS_DIR = Path(__file__).parent.parent / "receipts"


def load_run(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as f:
        return json.load(f)


def detect_drift(prior_run: dict, new_run: dict) -> list[dict]:
    """Compare envelopes + dispositions across runs."""
    receipts = []
    prior_map = {e["raw_action"]["id"]: e for e in prior_run["entries"]}
    new_map = {e["raw_action"]["id"]: e for e in new_run["entries"]}

    for act_id, new_entry in new_map.items():
        prior_entry = prior_map.get(act_id)
        if not prior_entry:
            continue

        if new_entry["envelope"] != prior_entry["envelope"]:
            delta = {
                k: f"{prior_entry['envelope'][k]} -> {new_entry['envelope'][k]}"
                for k in new_entry["envelope"]
                if new_entry["envelope"][k] != prior_entry["envelope"][k]
            }

            receipts.append(
                {
                    "drift_id": f"drift_{uuid.uuid4().hex[:8]}",
                    "timestamp": datetime.utcnow().isoformat(),
                    "raw_action": new_entry["raw_action"],
                    "prior_envelope": prior_entry["envelope"],
                    "new_envelope": new_entry["envelope"],
                    "delta": delta,
                    "prior_disposition": prior_entry["disposition"]["decision"],
                    "new_disposition": new_entry["disposition"]["decision"],
                }
            )

    return receipts


def store_receipts(receipts: list[dict]):
    RECEIPTS_DIR.mkdir(exist_ok=True)
    for receipt in receipts:
        path = RECEIPTS_DIR / f"{receipt['drift_id']}.json"
        with open(path, "w", encoding="utf-8") as f:
            json.dump(receipt, f, indent=2)