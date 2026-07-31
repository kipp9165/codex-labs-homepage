"""Founder Override Layer."""

def apply_founder_override(policy_context, governance_state):
    founder_required = governance_state.get("escalate", False)
    founder_present = policy_context.get("founder_present", False)
    return {
        "founder_required": founder_required,
        "founder_present": founder_present,
        "override_allowed": founder_present or not founder_required,
    }
