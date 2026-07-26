from codex_os.codex.os.os_api import codex_os_boot
from codex_os.codex.os.runtime_api import os_runtime
from codex_os.codex.os.distribution_api import os_distribution
from codex_os.codex.os.finalization_api import os_finalize
from codex_os.codex.os.completion_api import os_complete
from governance.governance_controller import enforce_rules, enforce_invariants
from identity.identity_controller import apply_identity

def public_boot(payload):
    result = codex_os_boot(payload)
    violations = enforce_rules(result) + enforce_invariants(result)
    result["governance_violations"] = violations
    result = apply_identity(result)
    return result

def public_runtime(payload):
    result = os_runtime(payload)
    violations = enforce_rules(result) + enforce_invariants(result)
    result["governance_violations"] = violations
    result = apply_identity(result)
    return result

def public_distribution(payload):
    result = os_distribution(payload)
    violations = enforce_rules(result) + enforce_invariants(result)
    result["governance_violations"] = violations
    result = apply_identity(result)
    return result

def public_finalize(payload):
    result = os_finalize(payload)
    violations = enforce_rules(result) + enforce_invariants(result)
    result["governance_violations"] = violations
    result = apply_identity(result)
    return result

def public_complete(payload):
    result = os_complete(payload)
    violations = enforce_rules(result) + enforce_invariants(result)
    result["governance_violations"] = violations
    result = apply_identity(result)
    return result


def public_status():
    return {"status": "ok", "service": "public_api"}


def public_health():
    return {"health": "ok", "service": "public_api"}


def public_version():
    return {"version": "v1"}