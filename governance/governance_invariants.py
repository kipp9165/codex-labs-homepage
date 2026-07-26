GOVERNANCE_INVARIANTS = {
    "os_state_invariant": "OS state must always be one of: boot, runtime, distribution, finalize, complete.",
    "version_invariant": "Version seal must match version_stamp.",
    "integrity_invariant": "Integrity envelope must validate against OS bundle.",
    "api_invariant": "Public API must return valid schema objects."
}

def get_invariant(name):
    return GOVERNANCE_INVARIANTS.get(name)