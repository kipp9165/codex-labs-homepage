from governance.governance_rules import GOVERNANCE_RULES
from governance.governance_invariants import GOVERNANCE_INVARIANTS
from governance.governance_registry import list_rules, list_invariants

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


def governance_invariants():
    return list_invariants()


def governance_rules():
    return list_rules()


def governance_audit():
    return {
        "rules": governance_rules(),
        "invariants": governance_invariants(),
        "status": "ok"
    }