from identity_envelope import generate_identity_envelope
from identity_signature import generate_identity_signature
from identity_registry import register_identity

def apply_identity(os_bundle):
    envelope = generate_identity_envelope(os_bundle)
    signature = generate_identity_signature(envelope)

    os_id = os_bundle.get("version_stamp","codex-os-unknown")
    register_identity(os_id, envelope, signature)

    os_bundle["identity_envelope"] = envelope
    os_bundle["identity_signature"] = signature

    return os_bundle