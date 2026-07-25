from runtime_api import os_runtime, os_runtime_shutdown

RUNTIME_REGISTRY = {
    "os_runtime": os_runtime,
    "os_runtime_shutdown": os_runtime_shutdown
}

def get_runtime_module(name):
    return RUNTIME_REGISTRY.get(name)