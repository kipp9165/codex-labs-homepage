MARKETPLACE_BUNDLES = {
    "master_systems_bundle": {
        "name": "Master Systems Bundle",
        "price": 24999,
        "stripe_product_id": "prod_master_systems_bundle",
        "tiers": ["v1", "v2.0", "v2.1"],
        "audience": "Full-system buyers",
        "support_level": "Priority",
        "deployment_guidance": True
    },
    "enterprise_deployment_bundle": {
        "name": "Enterprise Deployment Bundle",
        "price": 14999,
        "stripe_product_id": "prod_enterprise_deployment_bundle",
        "tiers": ["v1", "v2.0", "v2.1"],
        "audience": "Teams / Departments",
        "support_level": "Priority",
        "deployment_guidance": True
    },
    "operator_bundle": {
        "name": "Operator Bundle",
        "price": 9999,
        "stripe_product_id": "prod_operator_bundle",
        "tiers": ["v1", "v2.0"],
        "audience": "Founders / Solo Operators",
        "support_level": "Standard",
        "deployment_guidance": True
    },
    "legacy_evolution_dual_pack": {
        "name": "Legacy + Evolution Dual Pack",
        "price": 12500,
        "stripe_product_id": "prod_legacy_evolution_dual_pack",
        "tiers": ["v1", "v2.0"],
        "audience": "Foundations-first buyers",
        "support_level": "Standard",
        "deployment_guidance": True
    },
    "strategic_intelligence_bundle": {
        "name": "Strategic Intelligence Bundle",
        "price": 7500,
        "stripe_product_id": "prod_strategic_intelligence_bundle",
        "tiers": ["v2.0", "v2.1"],
        "audience": "Analysts / Strategic operators",
        "support_level": "Standard",
        "deployment_guidance": False
    }
}

MARKETPLACE_COLLECTIONS = {
    "master_collection": {
        "name": "Master Collection",
        "description": "Every artifact from v1 -> v2.1. The complete Codex OS universe."
    },
    "operator_collection": {
        "name": "Operator Collection",
        "description": "A curated set for founders and solo operators. High-clarity, high-impact, low-friction."
    },
    "enterprise_collection": {
        "name": "Enterprise Collection",
        "description": "Team-grade, multi-seat, structurally aligned. Built for organizations."
    },
    "legacy_collection": {
        "name": "Legacy Collection",
        "description": "Codex OS v1 + hybrid bundles. The foundation of the system."
    },
    "intelligence_collection": {
        "name": "Intelligence Collection",
        "description": "Decision-grade artifacts for analysts and strategic operators."
    }
}

MARKETPLACE_TIERS = {
    "v1": {
        "name": "Codex OS v1 - Legacy Tier",
        "pricing_band": "1299-1899",
        "description": "Foundational clarity. Operational stability."
    },
    "v2.0": {
        "name": "Codex OS v2.0 - Evolution Tier",
        "pricing_band": "2499-3999",
        "description": "Next-generation evolutionary mechanics. Structural expansion and capability growth."
    },
    "v2.1": {
        "name": "Codex OS v2.1 - Transformation Tier",
        "pricing_band": "3499-4999",
        "description": "Deep structural transformation. Substrate-level redefinition."
    }
}

def list_bundles():
    return list(MARKETPLACE_BUNDLES.values())

def list_collections():
    return list(MARKETPLACE_COLLECTIONS.values())

def list_tiers():
    return list(MARKETPLACE_TIERS.values())

def get_bundle(key):
    return MARKETPLACE_BUNDLES.get(key)

def get_collection(key):
    return MARKETPLACE_COLLECTIONS.get(key)

def get_tier(key):
    return MARKETPLACE_TIERS.get(key)