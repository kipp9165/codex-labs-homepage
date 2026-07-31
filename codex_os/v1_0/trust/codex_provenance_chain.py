"""Codex Provenance Chain."""


def build_provenance_chain(raw_actions, authenticity_state):
    chain = []
    for action in sorted(raw_actions, key=lambda item: str(item.get("id", ""))):
        chain.append(
            {
                "id": action.get("id"),
                "type": action.get("type", "unknown"),
                "domain": action.get("domain", "core"),
                "authentic": authenticity_state.get("authentic", False),
            }
        )
    return {
        "entries": chain,
        "count": len(chain),
    }
