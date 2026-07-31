"""Codex Product Generator."""

def mint_codex_product(product_seed, founder_gate):
    allowed = founder_gate.get("override_allowed", False)
    return {
        "seed": product_seed,
        "minted": allowed,
        "product_id": f"codex-product-{product_seed}",
    }
