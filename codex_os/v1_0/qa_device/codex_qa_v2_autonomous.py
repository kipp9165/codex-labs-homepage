"""Codex Q/A v2.0 — Autonomous Constitutional Responder."""

AUTHORITY_DOMAIN = "authority"
ADMISSIBILITY_DOMAIN = "admissibility"
CONTINUITY_DOMAIN = "continuity"
CONSEQUENCE_DOMAIN = "consequence"
INTEROPERABILITY_DOMAIN = "interoperability"

def classify_question(message_text):
    text = (message_text or "").lower()
    domains = []

    if any(word in text for word in ["authority", "permission", "delegation", "provenance", "legitimacy"]):
        domains.append(AUTHORITY_DOMAIN)
    if any(word in text for word in ["rule", "policy", "condition", "boundary", "enforce", "admissible"]):
        domains.append(ADMISSIBILITY_DOMAIN)
    if any(word in text for word in ["drift", "lineage", "time", "renewal", "chain", "continuity"]):
        domains.append(CONTINUITY_DOMAIN)
    if any(word in text for word in ["effect", "outcome", "impact", "sink", "consequence"]):
        domains.append(CONSEQUENCE_DOMAIN)
    if any(word in text for word in ["integrate", "interface", "align", "collaborate", "interop"]):
        domains.append(INTEROPERABILITY_DOMAIN)

    if not domains:
        domains.append(AUTHORITY_DOMAIN)

    return {
        "domains": domains,
        "altitude": "founder",
        "confidence": 0.9,
    }

def generate_response(sender_name, message_text, classification):
    domains = classification.get("domains", [])
    base = f"{sender_name} — "

    if AUTHORITY_DOMAIN in domains:
        body = (
            "Codex OS treats authority as a governed domain. "
            "Authority must be established, bound, and continuously renewed at the execution boundary. "
            "Receipts evidence that continuity."
        )
    elif ADMISSIBILITY_DOMAIN in domains:
        body = (
            "Codex OS evaluates admissibility at T=0 — identity, authority, and governing conditions. "
            "No effect-capable path opens unless admissibility is satisfied."
        )
    elif CONTINUITY_DOMAIN in domains:
        body = (
            "Codex OS preserves continuity through envelope lineage, drift deltas, and recomputable receipts. "
            "Continuity is legitimacy over time, not just duration."
        )
    elif CONSEQUENCE_DOMAIN in domains:
        body = (
            "Codex OS binds attempted execution, enforced disposition, and operational effect. "
            "Consequence is governed, not inferred."
        )
    else:
        body = (
            "Codex OS exposes portable, independently verifiable evidence surfaces that upstream or downstream systems "
            "can ingest without runtime coupling."
        )

    return base + body

def build_qa_receipt(sender_identity, message_text, classification, reply_text):
    return {
        "sender_identity": sender_identity,
        "responder_identity": "codex.qa.device.v2",
        "domains": classification.get("domains", []),
        "admissibility": "allowed",
        "disposition": "reply_sent",
        "message_text": message_text,
        "reply_text": reply_text,
    }