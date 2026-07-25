def check_replay_health(envelopes):
    return len(envelopes) > 0

def check_governance_health(governance):
    return len(governance) > 0

def check_drift_health(drift):
    return "summary" in drift and "dashboard" in drift

def run_health_checks(substrate):
    return {
        "replay_ok": check_replay_health(substrate["envelopes"]),
        "governance_ok": check_governance_health(substrate["governance"]),
        "drift_ok": check_drift_health(substrate["drift"])
    }