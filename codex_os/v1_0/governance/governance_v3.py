def evaluate(state):
    allowed_domains = set(state["policy_context"].get("allowed_domains", []))
    domains = {action.get("domain", "core") for action in state["actions"]}
    domain_ok = domains.issubset(allowed_domains) if allowed_domains else True
    state["receipts"].append({"layer": "governance_v3", "domains_ok": domain_ok})
    state["domains_ok"] = domain_ok
    return state
