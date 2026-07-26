PUBLIC_API_REGISTRY = {
    "boot": "/api/v1/boot",
    "runtime": "/api/v1/runtime",
    "distribution": "/api/v1/distribution",
    "finalize": "/api/v1/finalize",
    "complete": "/api/v1/complete"
}

def get_public_api_route(name):
    return PUBLIC_API_REGISTRY.get(name)