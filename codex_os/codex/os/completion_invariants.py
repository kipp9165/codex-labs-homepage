def assert_completion_integrity(bundle):
    assert "completion" in bundle
    assert "version_seal" in bundle
    assert "integrity_envelope" in bundle
    assert "diagnostics" in bundle or "shutdown_bundle" in bundle