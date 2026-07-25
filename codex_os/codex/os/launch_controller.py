from os_api import codex_os_boot, codex_os_shutdown
from os_diagnostics import generate_os_diagnostics

def launch_os(raw_actions):
    os_state = codex_os_boot(raw_actions)
    diagnostics = generate_os_diagnostics(os_state["os_state"])
    return {
        "launch": "Codex OS Launch Sequence",
        "os_state": os_state,
        "diagnostics": diagnostics
    }

def terminate_os():
    return {
        "launch": "Codex OS Termination Sequence",
        "shutdown": codex_os_shutdown()
    }