IDENTITY_REGISTRY = {}

def register_identity(os_id, envelope, signature):
    IDENTITY_REGISTRY[os_id] = {
        "envelope": envelope,
        "signature": signature
    }

def get_identity(os_id):
    return IDENTITY_REGISTRY.get(os_id)