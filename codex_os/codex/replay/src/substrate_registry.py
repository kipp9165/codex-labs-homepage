from codex_os.codex.replay.src.substrate_api import substrate, client_substrate

SUBSTRATE_REGISTRY = {
    "substrate": substrate,
    "client_substrate": client_substrate
}

def get_substrate(name):
    return SUBSTRATE_REGISTRY.get(name)