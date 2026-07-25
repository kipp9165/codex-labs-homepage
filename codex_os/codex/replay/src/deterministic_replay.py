import json

def deterministic_sort(raw_actions):
    return sorted(raw_actions, key=lambda a: a["id"])

def replay(raw_actions, classifier, scorer):
    actions = deterministic_sort(raw_actions)
    envelopes = []
    for act in actions:
        env = classifier(act)
        score = scorer(env)
        env["score"] = score
        envelopes.append(env)
    return envelopes