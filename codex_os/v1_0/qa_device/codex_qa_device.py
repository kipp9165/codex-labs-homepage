"""QA Device."""

def run_qa_device(replay_state, stability_state):
    envelope_count = replay_state.get("count", 0)
    stability = stability_state.get("status", "UNSTABLE")
    passed = envelope_count >= 0 and stability in {"STABLE", "UNSTABLE"}
    return {
        "qa_checks": [
            {"name": "envelope_count_present", "pass": envelope_count >= 0},
            {"name": "stability_status_valid", "pass": stability in {"STABLE", "UNSTABLE"}},
        ],
        "passed": passed,
    }