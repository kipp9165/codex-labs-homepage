def assert_governance_layer(gov_env):
    assert gov_env["layer"] == "governance"
    assert gov_env["domain"] in ["security", "infrastructure", "observability", "general"]
    assert gov_env["risk_class"] in ["critical", "high", "low"]