"""Constitutional Substrate for Codex OS v1.0."""


def build_constitutional_substrate():
    return {
        "module": "Constitutional Substrate",
        "version": "v1.0",
        "principles": [
            "Determinism before optimization",
            "Safety before throughput",
            "Provenance before privilege",
            "Founder override on business, deals, and money",
        ],
        "invariants": {
            "no_hidden_mutation": True,
            "explicit_receipts": True,
            "verifiable_provenance": True,
        },
    }
