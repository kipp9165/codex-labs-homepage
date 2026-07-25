# Codex OS Replay Battery v0.2

Replay Battery executes deterministic raw actions, classifies them into envelopes, computes dispositions, and detects drift between runs.

## Drift Engine v1

A drift occurs when any envelope field changes between runs. Drift receipts are stored in:

`codex_os/codex/replay/receipts/`

Each receipt contains:
- raw_action
- prior_envelope
- new_envelope
- delta
- prior_disposition
- new_disposition

## Drift Interpreter

Use `drift_interpreter.py` to convert receipts into human-readable summaries.

## Substrate Invariants

- Envelope fields must be stable across identical raw actions.
- Dispositions must be deterministic.
- Drift must only occur when envelope fields change.
- Drift receipts must be written atomically.
