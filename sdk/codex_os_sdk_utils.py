def validate_payload(payload):
    if payload is None:
        return {}
    assert isinstance(payload, dict)
    return payload

def pretty(data):
    import json
    return json.dumps(data, indent=2)