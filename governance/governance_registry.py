GOVERNANCE_REGISTRY = {
    "rules": [
        "version_policy",
        "integrity_policy",
        "lifecycle_policy",
        "api_policy",
        "rate_limit_policy",
        "bundle_policy"
    ],
    "invariants": [
        "os_state_invariant",
        "version_invariant",
        "integrity_invariant",
        "api_invariant"
    ]
}

def list_rules():
    return GOVERNANCE_REGISTRY["rules"]

def list_invariants():
    return GOVERNANCE_REGISTRY["invariants"]