def component_info(name):
    return {"component": name, "status": "ok"}


def component_registry():
    return {
        "components": [
            "header",
            "footer",
            "module-card",
            "tier-badge",
            "upsell-card"
        ]
    }


def component_metrics(name):
    return {"component": name, "metrics": {"views": 0, "errors": 0}}