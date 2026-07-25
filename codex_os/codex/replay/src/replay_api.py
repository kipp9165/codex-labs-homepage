from deterministic_replay import replay
from scoring_pass import score_envelope
from classifier_pass import classify_action

def run_replay(raw_actions):
    return replay(raw_actions, classify_action, score_envelope)