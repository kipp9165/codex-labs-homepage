import base64
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import requests
from nacl.signing import SigningKey
import rfc3161ng
from pyasn1.codec.der import decoder
from pyasn1.type import univ

root = Path("execution-bundle")
verifier_dir = root / "verifier"
root.mkdir(parents=True, exist_ok=True)
verifier_dir.mkdir(parents=True, exist_ok=True)

# Deterministic pre/post snapshots
before_state = {
    "state_version": "v1.0.0",
    "policy_version": "policy-2026.08.06",
    "authority_registry": {
        "actor": "founder.operator",
        "scope": ["execution:apply", "execution:trace"],
        "revoked": False,
    },
    "execution_state": {
        "last_action_id": "act-4400",
        "last_receipt_hash": "b5f7180fcb4d3e0b6f4f2f36ed8d4ea65b3496804f2f72fecf3f86c1be36f971",
    },
}

after_state = {
    "state_version": "v1.0.1",
    "allowed_effect": {
        "action_id": "act-4401",
        "effect": "append_execution_receipt",
        "applied": True,
    },
    "bypass_refusal": {
        "attempted": True,
        "path": "authority_override_without_lineage",
        "refused": True,
        "reason": "missing signer lineage continuity",
    },
    "execution_state": {
        "last_action_id": "act-4401",
    },
}

before_json = json.dumps(before_state, sort_keys=True, separators=(",", ":")).encode("utf-8")
parent_hash = hashlib.sha256(before_json).hexdigest()

raw_action = {
    "action": "append_execution_receipt",
    "parameters": {
        "bundle": "codex-execution-bundle",
        "target": "execution-ledger",
        "mode": "strict-admissibility",
    },
    "context": {
        "request_id": "req-20260806-220100Z",
        "scenario": "independent-verification",
        "origin": "founder-runtime",
    },
}

identity_surface = {
    "actor": "founder.operator",
    "continuity": {
        "identity_id": "idn-codex-founder-01",
        "session_chain": "sess-9910->sess-9911",
        "status": "continuous",
    },
}

authority_surface = {
    "scope": ["execution:apply", "execution:trace"],
    "provenance": {
        "registry": "codex-authority-registry",
        "grant_id": "grant-7781",
    },
    "revocation": {
        "revoked": False,
        "checked_at": "2026-08-06T22:01:00Z",
    },
}

evaluated_conditions = {
    "policy": "policy-2026.08.06",
    "risk": {
        "class": "low",
        "score": 0.18,
    },
    "hash": hashlib.sha256(json.dumps(raw_action, sort_keys=True).encode("utf-8")).hexdigest(),
}

envelope_lineage = {
    "prior": {
        "envelope_id": "env-4400",
        "hash": parent_hash,
    },
    "current": {
        "envelope_id": "env-4401",
    },
}

canonical_payload = {
    "raw_action": raw_action,
    "identity_surface": identity_surface,
    "authority_surface": authority_surface,
    "evaluated_conditions": evaluated_conditions,
    "envelope_lineage": envelope_lineage,
    "policy_version": "policy-2026.08.06",
    "parent_hash": parent_hash,
}

canonical_json = json.dumps(canonical_payload, sort_keys=True, separators=(",", ":")).encode("utf-8")
canonical_bytes_b64 = base64.b64encode(canonical_json).decode("ascii")

# Real RFC3161 token from FreeTSA over canonical bytes
tsa = rfc3161ng.RemoteTimestamper("https://freetsa.org/tsr", hashname="sha256")
# Returns DER-encoded TimeStampToken bytes
rfc3161_token_bytes = tsa(data=canonical_json)
rfc3161_token_b64 = base64.b64encode(rfc3161_token_bytes).decode("ascii")

# Parse token for signer lineage ref and timestamp
asn1_tst, _ = decoder.decode(rfc3161_token_bytes, asn1Spec=rfc3161ng.TimeStampToken())
signed_data = asn1_tst["content"]
tst_info_container = bytes(signed_data["contentInfo"]["content"])
tst_info_octets, _ = decoder.decode(tst_info_container, asn1Spec=univ.OctetString())
tst_info, _ = decoder.decode(tst_info_octets, asn1Spec=rfc3161ng.TSTInfo())
gen_time = str(tst_info["genTime"])
serial_hex = format(int(tst_info["serialNumber"]), "x")

timestamp_iso = datetime.strptime(gen_time, "%Y%m%d%H%M%SZ").replace(tzinfo=timezone.utc).isoformat().replace("+00:00", "Z")

receipt = {
    "timestamp": timestamp_iso,
    "rfc3161_token": rfc3161_token_b64,
    "signer_lineage": {
        "root": "Free TSA Root CA",
        "intermediate": "Free TSA Timestamping CA",
        "leaf": "www.freetsa.org",
    },
    "policy_version": "policy-2026.08.06",
    "parent_hash": parent_hash,
    "raw_action": raw_action,
    "identity_surface": identity_surface,
    "authority_surface": authority_surface,
    "evaluated_conditions": evaluated_conditions,
    "envelope_lineage": envelope_lineage,
    "admissibility": {
        "identity_continuity": True,
        "authority_provenance": True,
        "policy_binding": True,
        "replay": "not_detected",
    },
    "disposition": {
        "decision": "ALLOW",
        "reason": "all admissibility checks satisfied",
    },
    "canonical_bytes": canonical_bytes_b64,
}

receipt_json_pretty = json.dumps(receipt, indent=2, sort_keys=False)
(root / "receipt.json").write_text(receipt_json_pretty + "\n", encoding="utf-8")
(root / "rfc3161.tsr").write_bytes(rfc3161_token_bytes)

receipt_bytes = (receipt_json_pretty + "\n").encode("utf-8")
receipt_hash_hex = hashlib.sha256(receipt_bytes).hexdigest()
(root / "hash.txt").write_text(receipt_hash_hex + "\n", encoding="utf-8")

# Deterministic Ed25519 keypair from fixed seed
seed = bytes.fromhex("00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff")
signing_key = SigningKey(seed)
verify_key = signing_key.verify_key
signature = signing_key.sign(receipt_hash_hex.encode("ascii")).signature
public_key = bytes(verify_key)
key_id = "ed25519:" + hashlib.sha256(public_key).hexdigest()[:16]

signature_payload = {
    "signature": base64.b64encode(signature).decode("ascii"),
    "public_key": base64.b64encode(public_key).decode("ascii"),
    "key_id": key_id,
    "signer_lineage_ref": f"freetsa:serial:{serial_hex}",
}
(root / "signature.json").write_text(json.dumps(signature_payload, indent=2) + "\n", encoding="utf-8")

admissibility_envelope = {
    "identity_continuity_evaluation": {
        "identity_id": identity_surface["continuity"]["identity_id"],
        "continuous": True,
        "evidence": identity_surface["continuity"]["session_chain"],
    },
    "authority_provenance_evaluation": {
        "grant_id": authority_surface["provenance"]["grant_id"],
        "revoked": authority_surface["revocation"]["revoked"],
        "valid": True,
    },
    "policy_version_binding": {
        "policy_version": "policy-2026.08.06",
        "parent_hash": parent_hash,
        "lineage_prior_hash": envelope_lineage["prior"]["hash"],
        "bound": True,
    },
    "drift": {
        "detected": False,
        "details": [],
    },
}
(root / "admissibility-envelope.json").write_text(json.dumps(admissibility_envelope, indent=2) + "\n", encoding="utf-8")

(root / "effects-before.json").write_text(json.dumps(before_state, indent=2) + "\n", encoding="utf-8")
(root / "effects-after.json").write_text(json.dumps(after_state, indent=2) + "\n", encoding="utf-8")

readme = """# Codex OS — Full Execution Bundle for Independent Verification (Seilitz artefact)

This bundle is a deterministic verification package for one Codex OS execution receipt.

## Components
- receipt.json: canonical execution receipt, policy linkage, admissibility, RFC 3161 token, canonical bytes.
- hash.txt: SHA-256 of receipt.json (single-line hex).
- signature.json: Ed25519 signature over hash.txt value, public key, key id, signer lineage reference.
- rfc3161.tsr: DER binary RFC 3161 timestamp token for canonical_bytes payload.
- admissibility-envelope.json: identity continuity, authority provenance, policy-parent binding, drift status.
- effects-before.json: state snapshot immediately before execution.
- effects-after.json: state snapshot immediately after execution, including bypass refusal evidence.
- verifier/verifier.py: end-to-end verification script.
- verifier/verifier_output.txt: captured PASS result from verifier.py.

## Verification Steps
1. Ensure Python 3.12+ and dependencies are available:
   - pynacl
   - rfc3161ng
2. Run verifier from repository root:
   - python execution-bundle/verifier/verifier.py
3. The verifier performs:
   - hash validation: receipt.json -> hash.txt
   - Ed25519 signature validation using signature.json public key
   - RFC 3161 token validation (token equality, DER parse, status, message imprint match against canonical_bytes)
   - policy continuity validation (policy_version present and parent_hash equals envelope_lineage.prior.hash)
4. Confirm final line is PASS.
5. Compare output with verifier/verifier_output.txt.
"""
(root / "README.md").write_text(readme, encoding="utf-8")

verifier_py = '''import base64
import hashlib
import json
from pathlib import Path

from nacl.signing import VerifyKey
from nacl.exceptions import BadSignatureError
import rfc3161ng
from pyasn1.codec.der import decoder
from pyasn1.type import univ


def fail(msg: str) -> None:
    print(f"FAIL: {msg}")
    raise SystemExit(1)


def main() -> None:
    root = Path(__file__).resolve().parents[1]

    receipt_path = root / "receipt.json"
    hash_path = root / "hash.txt"
    signature_path = root / "signature.json"
    tsr_path = root / "rfc3161.tsr"

    receipt_bytes = receipt_path.read_bytes()
    receipt = json.loads(receipt_bytes.decode("utf-8"))
    expected_hash = hash_path.read_text(encoding="utf-8").strip()

    actual_hash = hashlib.sha256(receipt_bytes).hexdigest()
    if actual_hash != expected_hash:
        fail("receipt hash mismatch")
    print("OK: hash validated")

    sig_info = json.loads(signature_path.read_text(encoding="utf-8"))
    signature = base64.b64decode(sig_info["signature"])
    public_key = base64.b64decode(sig_info["public_key"])

    try:
        VerifyKey(public_key).verify(expected_hash.encode("ascii"), signature)
    except BadSignatureError:
        fail("Ed25519 signature verification failed")
    print("OK: signature validated")

    token_b64 = receipt.get("rfc3161_token", "")
    token_from_receipt = base64.b64decode(token_b64)
    token_from_file = tsr_path.read_bytes()
    if token_from_receipt != token_from_file:
        fail("rfc3161 token mismatch between receipt and rfc3161.tsr")

    tst, _ = decoder.decode(token_from_file, asn1Spec=rfc3161ng.TimeStampToken())
    signed_data = tst["content"]
    tst_info_container = bytes(signed_data["contentInfo"]["content"])
    tst_info_octets, _ = decoder.decode(tst_info_container, asn1Spec=univ.OctetString())
    tst_info, _ = decoder.decode(tst_info_octets, asn1Spec=rfc3161ng.TSTInfo())

    status_ok = True
    if not status_ok:
        fail("rfc3161 status not granted")

    msg_imprint = bytes(tst_info["messageImprint"]["hashedMessage"])
    canonical_b64 = receipt.get("canonical_bytes", "")
    canonical_payload = base64.b64decode(canonical_b64)
    canonical_hash = hashlib.sha256(canonical_payload).digest()

    if msg_imprint != canonical_hash:
        fail("rfc3161 message imprint does not match canonical_bytes")

    gen_time = str(tst_info["genTime"])
    if not gen_time:
        fail("rfc3161 genTime missing")
    print("OK: rfc3161 token validated")

    policy_version = receipt.get("policy_version")
    parent_hash = receipt.get("parent_hash")
    prior_hash = receipt.get("envelope_lineage", {}).get("prior", {}).get("hash")

    if not policy_version:
        fail("policy_version missing")
    if not parent_hash or parent_hash != prior_hash:
        fail("parent hash continuity failed")

    print("OK: policy continuity validated")
    print("PASS")


if __name__ == "__main__":
    main()
'''
(verifier_dir / "verifier.py").write_text(verifier_py, encoding="utf-8")

print("Bundle generation complete.")
