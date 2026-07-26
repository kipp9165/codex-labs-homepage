import hashlib

def generate_identity_signature(envelope):
    signature = hashlib.sha256(envelope.encode()).hexdigest()
    return signature