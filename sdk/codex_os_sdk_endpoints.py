ENDPOINTS = {
    "boot": "os_boot",
    "runtime": "os_runtime",
    "distribution": "os_distribution",
    "finalize": "os_finalize",
    "complete": "os_complete"
}

def get_endpoint(name):
    return ENDPOINTS.get(name)