from codex_os.codex.os.runtime_api import os_runtime, os_runtime_shutdown
from codex_os.codex.os.os_diagnostics import generate_os_diagnostics

def build_distribution_bundle(raw_actions):
    runtime_state = os_runtime(raw_actions)
    diagnostics = generate_os_diagnostics(runtime_state["runtime_state"]["launch_state"]["os_state"])
    return {
        "distribution": "Codex OS Distribution Bundle",
        "runtime_state": runtime_state,
        "diagnostics": diagnostics
    }

def build_distribution_shutdown():
    shutdown_state = os_runtime_shutdown()
    return {
        "distribution": "Codex OS Distribution Shutdown",
        "shutdown_state": shutdown_state
    }