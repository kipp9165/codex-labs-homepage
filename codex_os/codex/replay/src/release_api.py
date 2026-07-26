from codex_os.codex.replay.src.lifecycle_manager import substrate_boot, substrate_shutdown
from codex_os.codex.replay.src.diagnostics import generate_diagnostics

def release_boot(raw_actions):
    substrate = substrate_boot(raw_actions)
    diagnostics = generate_diagnostics(substrate)
    return {
        "substrate": substrate,
        "diagnostics": diagnostics
    }

def release_shutdown():
    return substrate_shutdown()