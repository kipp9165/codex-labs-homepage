from governance_rules import GOVERNANCE_RULES
from governance_invariants import GOVERNANCE_INVARIANTS

def enforce_rules(os_bundle):
    violations = []

    if "version_stamp" in os_bundle:
        if not os_bundle["version_stamp"]:
            violations.append("version_policy")

    if "integrity_envelope" in os_bundle:
        if not os_bundle["integrity_envelope"]:
            violations.append("integrity_policy")

    if "lifecycle" in os_bundle:
        lifecycle = os_bundle["lifecycle"]
        expected = ["boot", "runtime", "distribution", "finalize", "complete"]
        if lifecycle not in expected:
            violations.append("lifecycle_policy")

    return violations

def enforce_invariants(os_bundle):
    violations = []

    if "os_state" in os_bundle:
        if os_bundle["os_state"] not in ["boot", "runtime", "distribution", "finalize", "complete"]:
            violations.append("os_state_invariant")

    if "version_stamp" in os_bundle and "version_seal" in os_bundle:
        if os_bundle["version_stamp"] != os_bundle["version_seal"]:
            violations.append("version_invariant")

    if "integrity_envelope" in os_bundle:
        if not os_bundle["integrity_envelope"]:
            violations.append("integrity_invariant")

    return violations