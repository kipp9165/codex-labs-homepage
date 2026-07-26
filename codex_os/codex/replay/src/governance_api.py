from codex_os.codex.replay.src.governance_envelopes import build_governance_envelope
from codex_os.codex.replay.src.governance_disposition import compute_governance_disposition

def apply_governance(envelope):
    gov_env = build_governance_envelope(envelope)
    gov_env["governance_disposition"] = compute_governance_disposition(gov_env)
    return gov_env