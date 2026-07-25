from replay_api import run_replay
from drift_api import get_drift_state
from governance_api import apply_governance
from client_registry import get_client_module
from codex_os.os.completion_registry import get_completion_module
from codex_os.os.distribution_registry import get_distribution_module
from codex_os.os.finalization_registry import get_finalization_module
from codex_os.os.launch_registry import get_launch_module
from codex_os.os.os_registry import get_os_module
from codex_os.os.runtime_registry import get_runtime_module
from release_registry import get_release_module
from substrate_registry import get_substrate

REGISTRY = {
    "replay": run_replay,
    "drift": get_drift_state,
    "governance": apply_governance,
    "client_replay": get_client_module("client_replay"),
    "client_drift": get_client_module("client_drift"),
    "client_full": get_client_module("client_full"),
    "substrate": get_substrate("substrate"),
    "client_substrate": get_substrate("client_substrate"),
    "release_boot": get_release_module("release_boot"),
    "release_shutdown": get_release_module("release_shutdown"),
    "os_boot": get_os_module("os_boot"),
    "os_shutdown": get_os_module("os_shutdown"),
    "os_launch": get_launch_module("os_launch"),
    "os_terminate": get_launch_module("os_terminate"),
    "os_runtime": get_runtime_module("os_runtime"),
    "os_runtime_shutdown": get_runtime_module("os_runtime_shutdown"),
    "os_distribution": get_distribution_module("os_distribution"),
    "os_distribution_shutdown": get_distribution_module("os_distribution_shutdown"),
    "os_finalize": get_finalization_module("os_finalize"),
    "os_finalize_shutdown": get_finalization_module("os_finalize_shutdown"),
    "os_complete": get_completion_module("os_complete"),
    "os_complete_shutdown": get_completion_module("os_complete_shutdown"),
}

def get_module(name):
    return REGISTRY.get(name)