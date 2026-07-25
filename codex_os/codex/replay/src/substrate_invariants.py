def assert_substrate_integrity(substrate):
    assert "envelopes" in substrate
    assert "governance" in substrate
    assert "drift" in substrate

    assert isinstance(substrate["envelopes"], list)
    assert isinstance(substrate["governance"], list)
    assert isinstance(substrate["drift"], dict)