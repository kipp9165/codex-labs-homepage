import json
from datetime import datetime, timezone
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent.parent
ENVELOPES_DIR = BASE_DIR / "envelopes"
ACTIONS_DIR = BASE_DIR / "actions"
RECEIPTS_DIR = Path(__file__).resolve().parent / "receipts"


def _load_json(path: Path) -> dict:
    with open(path, "r", encoding="utf-8") as handle:
        return json.load(handle)


def _write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with open(path, "w", encoding="utf-8") as handle:
        json.dump(payload, handle, indent=2)


def _compute_delta(prior_envelope: dict, new_envelope: dict) -> dict:
    delta = {}
    keys = sorted(set(prior_envelope.keys()) | set(new_envelope.keys()))
    for key in keys:
        prior_value = prior_envelope.get(key)
        new_value = new_envelope.get(key)
        if prior_value != new_value:
            delta[key] = {
                "prior": prior_value,
                "new": new_value,
            }
    return delta


def run_replay_battery() -> dict:
    prior_path = ENVELOPES_DIR / "prior.json"
    current_path = ENVELOPES_DIR / "current.json"
    action_path = ACTIONS_DIR / "latest.json"

    prior_envelope = _load_json(prior_path)
    new_envelope = _load_json(current_path)
    raw_action = _load_json(action_path)

    receipt = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "raw_action": raw_action,
        "prior_envelope": prior_envelope,
        "new_envelope": new_envelope,
        "delta": _compute_delta(prior_envelope, new_envelope),
        "prior_disposition": prior_envelope.get("disposition"),
        "new_disposition": new_envelope.get("disposition"),
    }

    RECEIPTS_DIR.mkdir(parents=True, exist_ok=True)
    timestamp_key = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    receipt_path = RECEIPTS_DIR / f"receipt_{timestamp_key}.json"
    _write_json(receipt_path, receipt)

    print(json.dumps(receipt, indent=2))
    print(f"Wrote replay receipt: {receipt_path}")
    return receipt