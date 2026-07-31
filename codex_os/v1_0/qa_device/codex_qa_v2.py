"""Codex Q/A v2.0."""

def run_codex_qa_v2(qa_state, governance_state):
    checks = list(qa_state.get("qa_checks", []))
    checks.append(
        {
            "name": "governance_disposition_present",
            "pass": governance_state.get("disposition") in {"APPROVE", "REVIEW"},
        }
    )
    passed = all(item["pass"] for item in checks)
    return {"version": "v2.0", "checks": checks, "passed": passed}