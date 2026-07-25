from substrate_controller import run_substrate
from substrate_invariants import assert_substrate_integrity

def substrate_boot(raw_actions):
    substrate = run_substrate(raw_actions)
    assert_substrate_integrity(substrate)
    return substrate

def substrate_shutdown():
    return {
        "status": "shutdown",
        "message": "Replay Battery substrate terminated cleanly."
    }