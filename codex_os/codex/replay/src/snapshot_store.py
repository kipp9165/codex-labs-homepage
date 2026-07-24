import json
from datetime import datetime
from pathlib import Path

RUNS_DIR = Path(__file__).parent.parent / "runs"


def store_run(run_id: str, entries: list[dict]) -> Path:
    """Write a full replay run snapshot to disk."""
    RUNS_DIR.mkdir(exist_ok=True)
    run_path = RUNS_DIR / f"{run_id}.json"

    snapshot = {
        "run_id": run_id,
        "timestamp": datetime.utcnow().isoformat(),
        "entries": entries,
    }

    with open(run_path, "w", encoding="utf-8") as f:
        json.dump(snapshot, f, indent=2)

    return run_path