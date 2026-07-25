def assert_finalization_integrity(bundle):
    assert "finalization" in bundle
    assert "version_stamp" in bundle
    assert "diagnostics" in bundle or "shutdown_bundle" in bundle