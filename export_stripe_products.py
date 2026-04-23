#!/usr/bin/env python3
import json
import os
from pathlib import Path

import stripe


def _default_price_id(default_price):
    if isinstance(default_price, str):
        return default_price
    if isinstance(default_price, dict):
        return default_price.get("id")
    return None


def _serialize_price(price):
    recurring = price.get("recurring")
    recurring_data = None
    if recurring:
        recurring_data = {
            "interval": recurring.get("interval"),
            "interval_count": recurring.get("interval_count"),
            "usage_type": recurring.get("usage_type"),
            "aggregate_usage": recurring.get("aggregate_usage"),
            "trial_period_days": recurring.get("trial_period_days"),
            "meter": recurring.get("meter"),
        }

    return {
        "id": price.get("id"),
        "nickname": price.get("nickname"),
        "active": price.get("active"),
        "type": price.get("type"),
        "currency": price.get("currency"),
        "unit_amount": price.get("unit_amount"),
        "unit_amount_decimal": price.get("unit_amount_decimal"),
        "billing_scheme": price.get("billing_scheme"),
        "metadata": price.get("metadata") or {},
        "recurring": recurring_data,
    }


def main():
    api_key = os.getenv("STRIPE_API_KEY")
    if not api_key:
        raise SystemExit("Missing STRIPE_API_KEY environment variable.")

    stripe.api_key = api_key
    output_path = Path(__file__).resolve().parent / "products.json"
    exported_products = []

    for product in stripe.Product.list(limit=100).auto_paging_iter():
        prices = [
            _serialize_price(price)
            for price in stripe.Price.list(product=product["id"], limit=100).auto_paging_iter()
        ]

        exported_products.append(
            {
                "id": product.get("id"),
                "name": product.get("name"),
                "description": product.get("description"),
                "active": product.get("active"),
                "default_price_id": _default_price_id(product.get("default_price")),
                "metadata": product.get("metadata") or {},
                "prices": prices,
            }
        )

    with output_path.open("w", encoding="utf-8") as f:
        json.dump(exported_products, f, indent=2)

    print(f"Exported {len(exported_products)} products to {output_path}")


if __name__ == "__main__":
    main()
