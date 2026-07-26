from codex_os.codex.replay.src.release_api import release_boot, release_shutdown

RELEASE_REGISTRY = {
    "release_boot": release_boot,
    "release_shutdown": release_shutdown
}

def get_release_module(name):
    return RELEASE_REGISTRY.get(name)