"""Receipt Verification v2.0."""


def verify_receipt_v2(replay_state, trust_root_state):
    envelope_count = replay_state.get("count", 0)
    active = trust_root_state.get("active", False)
    ok = envelope_count >= 0 and active
    return {
        "version": "v2.0",
        "verified": ok,
        "envelope_count": envelope_count,
        "trust_root_active": active,
    }
