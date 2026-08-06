# Codex OS — Full Execution Bundle for Independent Verification (Seilitz artefact)

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
