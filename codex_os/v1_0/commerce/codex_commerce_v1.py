"""Codex Commerce v1.0."""

def run_codex_commerce_v1(raw_actions, founder_gate):
    allowed = founder_gate.get("override_allowed", False)
    return {
        "version": "v1.0",
        "commerce_allowed": allowed,
        "actions_processed": len(raw_actions),
    }
