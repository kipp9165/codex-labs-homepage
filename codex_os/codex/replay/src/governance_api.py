from governance_envelopes import build_governance_envelope
from governance_disposition import compute_governance_disposition

def apply_governance(envelope):
    gov_env = build_governance_envelope(envelope)
    gov_env["governance_disposition"] = compute_governance_disposition(gov_env)
    return gov_env