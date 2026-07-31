"""Stripe Mint/Remint Engine."""

def run_stripe_mint_remint(product_state, founder_gate):
    allowed = founder_gate.get("override_allowed", False)
    return {
        "stripe_ready": allowed,
        "product_id": product_state.get("product_id"),
        "remint": allowed,
    }
