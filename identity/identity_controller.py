from identity.identity_envelope import generate_identity_envelope
from identity.identity_signature import generate_identity_signature
from identity.identity_registry import register_identity, get_identity

def apply_identity(os_bundle):
    envelope = generate_identity_envelope(os_bundle)
    signature = generate_identity_signature(envelope)

    os_id = os_bundle.get("version_stamp","codex-os-unknown")
    register_identity(os_id, envelope, signature)

    os_bundle["identity_envelope"] = envelope
    os_bundle["identity_signature"] = signature

    return os_bundle


def identity_envelope():
    seed_bundle = {
        "version_stamp": "codex-os-identity",
        "integrity_envelope": "identity-seed"
    }
    return {"envelope": generate_identity_envelope(seed_bundle)}


def identity_profile(user_id="anonymous"):
    profile = get_identity(user_id) or {}
    return {"user_id": user_id, "profile": profile}


def identity_permissions(user_id="anonymous"):
    return {"user_id": user_id, "permissions": ["read", "execute"]}