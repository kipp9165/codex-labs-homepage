from replay.src.substrate_controller import run_substrate
from replay.src.lifecycle_manager import substrate_shutdown
from replay.src.diagnostics import generate_diagnostics

def os_boot(raw_actions):
    substrate = run_substrate(raw_actions)
    diagnostics = generate_diagnostics(substrate)
    return {
        "os": "Codex OS",
        "substrate": substrate,
        "diagnostics": diagnostics
    }

def os_shutdown():
    return {
        "os": "Codex OS",
        "shutdown": substrate_shutdown()
    }