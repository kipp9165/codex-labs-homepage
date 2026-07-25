from distribution_api import os_distribution, os_distribution_shutdown

DISTRIBUTION_REGISTRY = {
    "os_distribution": os_distribution,
    "os_distribution_shutdown": os_distribution_shutdown
}

def get_distribution_module(name):
    return DISTRIBUTION_REGISTRY.get(name)