"""Codex Authenticity Engine."""


def run_authenticity_engine(receipt_state, qa_v2_state):
    verified = receipt_state.get("verified", False)
    qa_passed = qa_v2_state.get("passed", False)
    authentic = verified and qa_passed
    return {
        "authentic": authentic,
        "verified": verified,
        "qa_passed": qa_passed,
    }
