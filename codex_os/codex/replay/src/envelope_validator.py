def validate_envelope(envelope):
    assert "surface" in envelope
    assert "operation_class" in envelope
    assert "risk_class" in envelope
    assert "irreversibility" in envelope

    assert envelope["surface"] in ["secrets", "system", "logs", "other", "project"]
    assert envelope["operation_class"] in ["read", "write", "execute"]
    assert envelope["risk_class"] in ["critical", "high", "low"]
    assert envelope["irreversibility"] in ["reversible", "irreversible"]

    return True
