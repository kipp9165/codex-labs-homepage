"""Trust Root v1.0."""


def build_trust_root(substrate_state, governance_state):
    principle_count = len(substrate_state.get("principles", []))
    governance_receipts = len(governance_state.get("receipts", []))
    return {
        "version": "v1.0",
        "root_hash_material": "TR-" + str(principle_count) + "-" + str(governance_receipts),
        "active": True,
    }
