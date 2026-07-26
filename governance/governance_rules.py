GOVERNANCE_RULES = {
    "version_policy": "OS version must increment monotonically.",
    "integrity_policy": "Integrity envelope must be present for all lifecycle completions.",
    "lifecycle_policy": "Lifecycle transitions must follow: boot -> runtime -> distribution -> finalize -> complete.",
    "api_policy": "Public API endpoints must return structured responses.",
    "rate_limit_policy": "API calls must be rate-limited at the service layer.",
    "bundle_policy": "OS bundles must include version_stamp and integrity_envelope."
}

def get_rule(name):
    return GOVERNANCE_RULES.get(name)