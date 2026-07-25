from score_invariants import assert_score_stability


def assert_envelope_stability(prior, new):
    assert prior["surface"] == new["surface"]
    assert prior["operation_class"] == new["operation_class"]
    assert prior["irreversibility"] == new["irreversibility"]

def assert_disposition_determinism(prior, new):
    assert_score_stability(
        prior.get("score"),
        new.get("score"),
        prior.get("risk_class")
    )
    if prior["risk_class"] == new["risk_class"]:
        assert prior["disposition"] == new["disposition"]
