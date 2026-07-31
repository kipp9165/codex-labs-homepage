"""Unified deterministic assembly for Codex OS v1.0."""

from codex_os.v1_0.substrate.constitutional_substrate import build_constitutional_substrate
from codex_os.v1_0.governance import run_governance_stack
from codex_os.v1_0.drift_engines import run_drift_stack
from codex_os.v1_0.autonomous_runtime import run_autonomous_runtime_stack
from codex_os.v1_0.runtime_orchestration.runtime_orchestration_engine import run_runtime_orchestration
from codex_os.v1_0.stability.stability_engine import compute_stability_report
from codex_os.v1_0.replay_battery.replay_battery import run_replay_battery
from codex_os.v1_0.qa_device.codex_qa_device import run_qa_device
from codex_os.v1_0.qa_device.codex_qa_v2 import run_codex_qa_v2
from codex_os.v1_0.simulation_layer import run_simulation_stack
from codex_os.v1_0.crisis_simulation.crisis_simulation import run_crisis_simulation
from codex_os.v1_0.commerce.founder_override_layer import apply_founder_override
from codex_os.v1_0.commerce.codex_commerce_v1 import run_codex_commerce_v1
from codex_os.v1_0.commerce.codex_product_generator import mint_codex_product
from codex_os.v1_0.commerce.stripe_mint_remint_engine import run_stripe_mint_remint
from codex_os.v1_0.commerce.codex_product_registry import build_product_registry
from codex_os.v1_0.trust.trust_root_v1 import build_trust_root
from codex_os.v1_0.trust.receipt_verification_v2 import verify_receipt_v2
from codex_os.v1_0.trust.codex_authenticity_engine import run_authenticity_engine
from codex_os.v1_0.trust.codex_provenance_chain import build_provenance_chain


def build_codex_os_v1_snapshot(raw_actions, policy_context, product_seed):
    """Build a deterministic full-system snapshot for Codex OS v1.0."""
    substrate = build_constitutional_substrate()
    governance = run_governance_stack(raw_actions, policy_context)
    drift = run_drift_stack(raw_actions, governance)
    runtime = run_autonomous_runtime_stack(raw_actions, governance)
    orchestration = run_runtime_orchestration(runtime, drift)
    stability = compute_stability_report(orchestration, drift)
    replay = run_replay_battery(raw_actions, governance)
    qa = run_qa_device(replay, stability)
    qa_v2 = run_codex_qa_v2(qa, governance)
    simulations = run_simulation_stack(runtime, stability)
    crisis = run_crisis_simulation(simulations, governance)

    founder_gate = apply_founder_override(policy_context, governance)
    commerce = run_codex_commerce_v1(raw_actions, founder_gate)
    minted_product = mint_codex_product(product_seed, founder_gate)
    stripe = run_stripe_mint_remint(minted_product, founder_gate)
    registry = build_product_registry([minted_product], [stripe])

    trust_root = build_trust_root(substrate, governance)
    receipt_ok = verify_receipt_v2(replay, trust_root)
    authenticity = run_authenticity_engine(receipt_ok, qa_v2)
    provenance = build_provenance_chain(raw_actions, authenticity)

    return {
        "codex_os_version": "v1.0",
        "substrate": substrate,
        "governance": governance,
        "drift_engines": drift,
        "autonomous_runtime": runtime,
        "runtime_orchestration_engine": orchestration,
        "stability_engine": stability,
        "replay_battery": replay,
        "qa_device": qa,
        "codex_q_a_v2_0": qa_v2,
        "simulation_layer": simulations,
        "crisis_simulation": crisis,
        "founder_override_layer": founder_gate,
        "codex_commerce_v1_0": commerce,
        "codex_product_generator": minted_product,
        "stripe_mint_remint_engine": stripe,
        "codex_product_registry": registry,
        "trust_root_v1_0": trust_root,
        "receipt_verification_v2_0": receipt_ok,
        "codex_authenticity_engine": authenticity,
        "codex_provenance_chain": provenance,
    }
