from codex_os.codex.os.os_api import codex_os_boot, codex_os_shutdown

OS_REGISTRY = {
    "os_boot": codex_os_boot,
    "os_shutdown": codex_os_shutdown
}

def get_os_module(name):
    return OS_REGISTRY.get(name)