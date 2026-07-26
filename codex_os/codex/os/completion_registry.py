from codex_os.codex.os.completion_api import os_complete, os_complete_shutdown

COMPLETION_REGISTRY = {
    "os_complete": os_complete,
    "os_complete_shutdown": os_complete_shutdown
}

def get_completion_module(name):
    return COMPLETION_REGISTRY.get(name)