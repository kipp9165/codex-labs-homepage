def validate_envelope(env):
    assert "surface" in env
    assert "operation_class" in env
    assert "risk_class" in env
    assert "irreversibility" in env

    assert env["surface"] in ["secrets", "system", "logs", "other"]
    assert env["operation_class"] in ["read", "write", "execute"]
    assert env["risk_class"] in ["critical", "high", "low"]
    assert env["irreversibility"] in ["reversible", "irreversible"]

    return True
