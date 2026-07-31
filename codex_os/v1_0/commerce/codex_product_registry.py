"""Codex Product Registry."""

def build_product_registry(products, stripe_states):
    registry = []
    for product, stripe in zip(products, stripe_states):
        registry.append(
            {
                "product_id": product.get("product_id"),
                "minted": product.get("minted"),
                "stripe_ready": stripe.get("stripe_ready"),
            }
        )
    return {"registry": registry, "count": len(registry)}
