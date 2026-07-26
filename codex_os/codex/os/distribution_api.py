from codex_os.codex.os.distribution_controller import build_distribution_bundle, build_distribution_shutdown
from codex_os.codex.os.distribution_invariants import assert_distribution_integrity

def os_distribution(raw_actions):
    bundle = build_distribution_bundle(raw_actions)
    assert_distribution_integrity(bundle)
    return bundle

def os_distribution_shutdown():
    bundle = build_distribution_shutdown()
    assert_distribution_integrity(bundle)
    return bundle