from finalization_controller import finalize_os, finalize_os_shutdown
from finalization_invariants import assert_finalization_integrity

def os_finalize(raw_actions):
    bundle = finalize_os(raw_actions)
    assert_finalization_integrity(bundle)
    return bundle

def os_finalize_shutdown():
    bundle = finalize_os_shutdown()
    assert_finalization_integrity(bundle)
    return bundle