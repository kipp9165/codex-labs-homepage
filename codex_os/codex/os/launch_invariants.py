def assert_launch_integrity(launch_state):
    assert "launch" in launch_state
    assert "os_state" in launch_state or "shutdown" in launch_state