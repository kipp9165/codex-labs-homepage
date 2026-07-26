from codex_os.codex.os.launch_api import os_launch, os_terminate
from codex_os.codex.os.os_diagnostics import generate_os_diagnostics

def runtime_step(raw_actions):
    launch_state = os_launch(raw_actions)
    diagnostics = generate_os_diagnostics(launch_state["os_state"])
    return {
        "runtime": "Codex OS Runtime Step",
        "launch_state": launch_state,
        "diagnostics": diagnostics
    }

def runtime_shutdown():
    return {
        "runtime": "Codex OS Runtime Shutdown",
        "shutdown": os_terminate()
    }