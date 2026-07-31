"""Runtime Orchestration Engine."""

def run_runtime_orchestration(runtime_state, drift_state):
    orchestration_mode = "strict" if drift_state.get("disposition") == "DRIFT_ALERT" else "balanced"
    execution = {
        "runtime_disposition": runtime_state.get("disposition", "RUNTIME_HOLD"),
        "drift_disposition": drift_state.get("disposition", "DRIFT_STABLE"),
        "mode": orchestration_mode,
    }
    execution["orchestration_disposition"] = (
        "ORCHESTRATE_GO"
        if execution["runtime_disposition"] == "RUNTIME_GO" and execution["drift_disposition"] == "DRIFT_STABLE"
        else "ORCHESTRATE_REVIEW"
    )
    return execution