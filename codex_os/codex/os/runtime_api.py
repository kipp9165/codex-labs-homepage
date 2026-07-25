from runtime_controller import runtime_step, runtime_shutdown
from runtime_invariants import assert_runtime_integrity
from runtime_state_machine import RuntimeStateMachine

def os_runtime(raw_actions):
    machine = RuntimeStateMachine()
    machine.transition("BOOT")
    state = runtime_step(raw_actions)
    assert_runtime_integrity(state)
    return {
        "state_machine": machine.state,
        "runtime_state": state
    }

def os_runtime_shutdown():
    machine = RuntimeStateMachine()
    machine.transition("SHUTDOWN")
    state = runtime_shutdown()
    return {
        "state_machine": machine.state,
        "runtime_state": state
    }