import hashlib
import time

def generate_identity_envelope(os_bundle):
    payload = f"{os_bundle.get('version_stamp','')}-{os_bundle.get('integrity_envelope','')}-{time.time()}"
    envelope = hashlib.sha256(payload.encode()).hexdigest()
    return envelope