from client_api import client_replay, client_drift, client_full

CLIENT_REGISTRY = {
    "client_replay": client_replay,
    "client_drift": client_drift,
    "client_full": client_full
}

def get_client_module(name):
    return CLIENT_REGISTRY.get(name)