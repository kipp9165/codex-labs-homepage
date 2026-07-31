"""Stability Engine for Codex OS v1.0."""

def compute_stability_report(orchestration_state, drift_state):
    drift_penalty = 30 if drift_state.get("disposition") == "DRIFT_ALERT" else 0
    orchestration_penalty = 20 if orchestration_state.get("orchestration_disposition") == "ORCHESTRATE_REVIEW" else 0
    score = 100 - drift_penalty - orchestration_penalty
    status = "STABLE" if score >= 70 else "UNSTABLE"
    return {"score": score, "status": status}