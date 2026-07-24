from pathlib import Path

from classifier_pass import classify
from drift_detector import detect_drift, load_run, store_receipts
from raw_actions import load_raw_actions
from scoring_pass import score
from snapshot_store import store_run


def run_replay():
    raw_actions = load_raw_actions()

    entries = []
    for act in raw_actions:
        envelope = classify(act)
        disposition = score(envelope)
        entries.append(
            {
                "raw_action": act,
                "envelope": envelope,
                "disposition": disposition,
            }
        )

    runs_dir = Path(__file__).parent.parent / "runs"
    runs_dir.mkdir(exist_ok=True)
    runs = sorted(runs_dir.glob("run_*.json"))
    next_id = f"run_{len(runs) + 1:04d}"

    new_run_path = store_run(next_id, entries)

    if runs:
        prior_run = load_run(runs[-1])
        new_run = load_run(new_run_path)
        receipts = detect_drift(prior_run, new_run)
        if receipts:
            store_receipts(receipts)


if __name__ == "__main__":
    run_replay()