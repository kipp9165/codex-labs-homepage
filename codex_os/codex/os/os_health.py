def check_os_health(os_state):
    return {
        "substrate_ok": "substrate" in os_state,
        "diagnostics_ok": "diagnostics" in os_state
    }