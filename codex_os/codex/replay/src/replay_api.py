from codex_os.codex.replay.src.deterministic_replay import replay
from codex_os.codex.replay.src.scoring_pass import score_envelope
from codex_os.codex.replay.src.classifier_pass import classify_action

def run_replay(raw_actions):
    return replay(raw_actions, classify_action, score_envelope)