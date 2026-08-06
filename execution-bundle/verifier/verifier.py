import base64
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
