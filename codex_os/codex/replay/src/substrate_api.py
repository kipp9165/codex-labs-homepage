from substrate_controller import run_substrate, run_client_substrate
from substrate_invariants import assert_substrate_integrity

def substrate(raw_actions):
    result = run_substrate(raw_actions)
    assert_substrate_integrity(result)
    return result

def client_substrate(raw_actions):
    result = run_client_substrate(raw_actions)
    assert_substrate_integrity(result)
    return result