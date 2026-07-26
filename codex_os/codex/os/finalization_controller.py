from codex_os.codex.os.distribution_api import os_distribution, os_distribution_shutdown
from codex_os.codex.os.os_diagnostics import generate_os_diagnostics

def finalize_os(raw_actions):
    distribution_bundle = os_distribution(raw_actions)
    diagnostics = generate_os_diagnostics(distribution_bundle["runtime_state"]["runtime_state"]["launch_state"]["os_state"])
    return {
        "finalization": "Codex OS Finalization Bundle",
        "distribution_bundle": distribution_bundle,
        "diagnostics": diagnostics,
        "version_stamp": "CodexOS-1.5"
    }

def finalize_os_shutdown():
    shutdown_bundle = os_distribution_shutdown()
    return {
        "finalization": "Codex OS Finalization Shutdown",
        "shutdown_bundle": shutdown_bundle,
        "version_stamp": "CodexOS-1.5"
    }