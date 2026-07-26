from marketplace.marketplace_registry import (
    list_bundles,
    list_collections,
    list_tiers,
    get_bundle
)
from governance.governance_controller import enforce_rules, enforce_invariants
from identity.identity_controller import apply_identity

def get_marketplace_overview():
    return {
        "bundles": list_bundles(),
        "collections": list_collections(),
        "tiers": list_tiers()
    }

def get_bundle_details(bundle_key):
    bundle = get_bundle(bundle_key)
    if not bundle:
        return None

    os_bundle = {
        "version_stamp": "CodexOS-v3.0",
        "integrity_envelope": "CodexOS-Integrity-v2.0",
        "lifecycle": "complete",
        "os_state": "complete",
        "bundle": bundle
    }

    violations = enforce_rules(os_bundle) + enforce_invariants(os_bundle)
    os_bundle["governance_violations"] = violations

    os_bundle = apply_identity(os_bundle)
    return os_bundle


def marketplace_overview():
    return get_marketplace_overview()


def marketplace_item(item_id):
    return get_bundle_details(item_id)


def marketplace_search(query):
    needle = str(query or "").lower()
    return [bundle for bundle in list_bundles() if needle in bundle.get("name", "").lower()]