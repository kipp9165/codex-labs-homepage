from codex_os.codex.os.launch_controller import launch_os, terminate_os
from codex_os.codex.os.launch_invariants import assert_launch_integrity

def os_launch(raw_actions):
    state = launch_os(raw_actions)
    assert_launch_integrity(state)
    return state

def os_terminate():
    state = terminate_os()
    assert_launch_integrity(state)
    return state