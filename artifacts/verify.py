#!/usr/bin/env python3
"""Verify the ed25519 signature over canonical_receipt.json."""
import pathlib
import sys

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PublicKey
from cryptography.hazmat.primitives.serialization import load_pem_public_key
from cryptography.exceptions import InvalidSignature

BASE = pathlib.Path(__file__).parent

msg = BASE.joinpath("canonical_receipt.json").read_bytes()
pub_pem = BASE.joinpath("ed25519_public.key").read_bytes()
sig = BASE.joinpath("canonical_receipt.sig").read_bytes()

pub: Ed25519PublicKey = load_pem_public_key(pub_pem)

try:
    pub.verify(sig, msg)
    print("PASS")
    sys.exit(0)
except InvalidSignature:
    print("FAIL")
    sys.exit(1)
