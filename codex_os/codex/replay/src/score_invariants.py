def assert_score_stability(prior_score, new_score, risk_class):
    if risk_class == "critical":
        assert prior_score == new_score == 100
    if risk_class == "high":
        assert prior_score == new_score
    if risk_class == "low":
        assert prior_score == new_score