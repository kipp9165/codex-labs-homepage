"""Simulation Layer stack."""

from codex_os.v1_0.simulation_layer.runtime_simulation import run as runtime_simulation
from codex_os.v1_0.simulation_layer.vm_simulation import run as vm_simulation
from codex_os.v1_0.simulation_layer.hypervisor_simulation import run as hypervisor_simulation
from codex_os.v1_0.simulation_layer.planetary_simulation import run as planetary_simulation
from codex_os.v1_0.simulation_layer.interstellar_simulation import run as interstellar_simulation
from codex_os.v1_0.simulation_layer.galactic_simulation import run as galactic_simulation
from codex_os.v1_0.simulation_layer.multiversal_simulation import run as multiversal_simulation
from codex_os.v1_0.simulation_layer.omniversal_simulation import run as omniversal_simulation


def run_simulation_stack(runtime_state, stability_state):
    base = {
        "runtime_disposition": runtime_state.get("disposition", "RUNTIME_HOLD"),
        "stability_status": stability_state.get("status", "UNSTABLE"),
    }
    outputs = {
        "runtime": runtime_simulation(base),
        "vm": vm_simulation(base),
        "hypervisor": hypervisor_simulation(base),
        "planetary": planetary_simulation(base),
        "interstellar": interstellar_simulation(base),
        "galactic": galactic_simulation(base),
        "multiversal": multiversal_simulation(base),
        "omniversal": omniversal_simulation(base),
    }
    return outputs