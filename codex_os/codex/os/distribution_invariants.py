def assert_distribution_integrity(bundle):
    assert "distribution" in bundle
    assert "diagnostics" in bundle or "shutdown_state" in bundle