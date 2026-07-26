from codex_os.codex.os.completion_controller import complete_os, complete_os_shutdown
from codex_os.codex.os.completion_invariants import assert_completion_integrity

def os_complete(raw_actions):
    bundle = complete_os(raw_actions)
    assert_completion_integrity(bundle)
    return bundle

def os_complete_shutdown():
    bundle = complete_os_shutdown()
    assert_completion_integrity(bundle)
    return bundle