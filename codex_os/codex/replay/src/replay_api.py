def run_replay(envelope):
    from codex_os.codex.replay.src.classifier_pass import classify_action
    from codex_os.codex.replay.src.module_registry import get_module
    from codex_os.codex.replay.src.substrate_controller import run_substrate
    from codex_os.codex.replay.src.lifecycle_manager import substrate_shutdown
    from codex_os.codex.replay.src.diagnostics import generate_diagnostics
    from codex_os.codex.replay.src.envelope_validator import validate_envelope
    from codex_os.codex.replay.src.deterministic_replay import replay
    from codex_os.codex.replay.src.scoring_pass import score_envelope

    _ = (get_module, run_substrate, substrate_shutdown, generate_diagnostics)
    return replay(envelope, classify_action, score_envelope)