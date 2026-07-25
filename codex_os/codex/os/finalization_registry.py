from finalization_api import os_finalize, os_finalize_shutdown

FINALIZATION_REGISTRY = {
    "os_finalize": os_finalize,
    "os_finalize_shutdown": os_finalize_shutdown
}

def get_finalization_module(name):
    return FINALIZATION_REGISTRY.get(name)