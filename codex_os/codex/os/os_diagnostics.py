from os_health import check_os_health

def generate_os_diagnostics(os_state):
    health = check_os_health(os_state)
    return {
        "os_health": health,
        "diagnostics": "Codex OS unified diagnostics complete."
    }