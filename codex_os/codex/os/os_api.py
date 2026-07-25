from os_controller import os_boot, os_shutdown
from os_diagnostics import generate_os_diagnostics

def codex_os_boot(raw_actions):
    os_state = os_boot(raw_actions)
    diag = generate_os_diagnostics(os_state)
    return {
        "os_state": os_state,
        "diagnostics": diag
    }

def codex_os_shutdown():
    return os_shutdown()