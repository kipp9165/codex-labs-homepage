from codex_os.codex.os.finalization_api import os_finalize, os_finalize_shutdown
from codex_os.codex.os.os_diagnostics import generate_os_diagnostics

def complete_os(raw_actions):
    final_bundle = os_finalize(raw_actions)
    diagnostics = generate_os_diagnostics(final_bundle["distribution_bundle"]["runtime_state"]["runtime_state"]["launch_state"]["os_state"])
    return {
        "completion": "Codex OS Unified Completion Bundle",
        "final_bundle": final_bundle,
        "diagnostics": diagnostics,
        "integrity_envelope": "CodexOS-Integrity-v2.0",
        "version_seal": "CodexOS-v2.0"
    }

def complete_os_shutdown():
    shutdown_bundle = os_finalize_shutdown()
    return {
        "completion": "Codex OS Unified Completion Shutdown",
        "shutdown_bundle": shutdown_bundle,
        "integrity_envelope": "CodexOS-Integrity-v2.0",
        "version_seal": "CodexOS-v2.0"
    }