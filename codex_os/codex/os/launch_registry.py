from codex_os.codex.os.launch_api import os_launch, os_terminate

LAUNCH_REGISTRY = {
    "os_launch": os_launch,
    "os_terminate": os_terminate
}

def get_launch_module(name):
    return LAUNCH_REGISTRY.get(name)