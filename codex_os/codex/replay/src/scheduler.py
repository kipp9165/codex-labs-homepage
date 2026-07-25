from pathlib import Path

from classifier_pass import classify as classify_action
from deterministic_replay import replay
from disposition_engine import compute_disposition
from drift_dashboard import generate_dashboard
from drift_detector import detect_drift, load_run, store_receipts
from drift_interpreter import interpret_drift
from governance_disposition import compute_governance_disposition
from governance_envelopes import build_governance_envelope
from governance_invariants import assert_governance_layer
from invariants import assert_disposition_determinism, assert_envelope_stability
from module_registry import get_module
from raw_actions import load_raw_actions
from scoring_pass import score_envelope
from snapshot_store import store_run


def run_replay():
    raw_actions = load_raw_actions()
    replay_module = get_module("replay")
    envelopes = replay_module(raw_actions)

    entries = []
    for act, envelope in zip(sorted(raw_actions, key=lambda a: a["id"]), envelopes):
        disposition = compute_disposition(envelope)
        envelope["disposition"] = disposition
        gov_env = build_governance_envelope(envelope)
        gov_disposition = compute_governance_disposition(gov_env)
        gov_env["governance_disposition"] = gov_disposition
        assert_governance_layer(gov_env)
        envelope["governance"] = gov_env
        entries.append(
            {
                "raw_action": act,
                "envelope": envelope,
                "disposition": {"decision": disposition},
            }
        )

    runs_dir = Path(__file__).parent.parent / "runs"
    runs_dir.mkdir(exist_ok=True)

    # Load all existing runs
    runs = sorted(runs_dir.glob("run_*.json"))

    # Determine next run ID
    next_id = f"run_{len(runs) + 1:04d}"

    # Store the new run
    new_run_path = store_run(next_id, entries)

    # Detect drift ONLY if there is a prior run
    if len(runs) >= 1:
        prior_run_path = runs[-1]  # last existing run BEFORE this one
        prior_run = load_run(prior_run_path)
        new_run = load_run(new_run_path)

        receipts = detect_drift(prior_run, new_run)
        if receipts:
            store_receipts(receipts)

    dashboard_output = generate_dashboard(Path(__file__).parent.parent / "receipts")
    print("\n=== Drift Dashboard ===")
    print(dashboard_output)


if __name__ == "__main__":
    run_replay()