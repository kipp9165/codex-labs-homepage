from __future__ import annotations

from datetime import datetime, timezone
from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter(prefix="/api/whale")


def _as_dict(value: Any) -> dict[str, Any]:
    return value if isinstance(value, dict) else {}


def _field_present(value: Any) -> bool:
    if value is None:
        return False
    if isinstance(value, str):
        return bool(value.strip())
    if isinstance(value, (list, tuple, set, dict)):
        return len(value) > 0
    return True


def _score_presence(payload: dict[str, Any], fields: list[str]) -> int:
    if not fields:
        return 0
    hits = sum(1 for field in fields if _field_present(payload.get(field)))
    return round((hits / len(fields)) * 100)


def _score_with_bonus(base: int, bonuses: list[int]) -> int:
    return max(0, min(100, base + sum(bonuses)))


class WhalePayload(BaseModel):
    lead: dict[str, Any] | None = None
    crm: dict[str, Any] | None = None
    tier: str | None = None
    referral: str | None = None
    timestamp: str | None = None


class WhaleContinuityRequest(BaseModel):
    lead: dict[str, Any] | None = None
    crm: dict[str, Any] | None = None


_whale_state: dict[str, Any] = {
    "last_intake": None,
    "last_score": None,
}


@router.post("/intake")
def whale_intake(payload: WhalePayload):
    lead = _as_dict(payload.lead)
    crm = _as_dict(payload.crm)
    intake = {
        "lead": lead,
        "crm": crm,
        "tier": payload.tier or lead.get("tier") or crm.get("tier"),
        "referral": payload.referral or lead.get("referral") or crm.get("referral"),
        "timestamp": payload.timestamp or datetime.now(timezone.utc).isoformat(),
    }
    _whale_state["last_intake"] = intake
    return {
        "ok": True,
        "message": "Whale data received.",
        "data": intake,
    }


@router.post("/continuity-score")
def whale_continuity_score(payload: WhaleContinuityRequest):
    lead = _as_dict(payload.lead)
    crm = _as_dict(payload.crm)

    governance_alignment_score = _score_with_bonus(
        _score_presence(crm, ["event", "eventType", "status", "source", "referral"]),
        [10 if _field_present(lead.get("tier")) else 0],
    )
    continuity_stability_score = _score_presence(
        crm,
        ["stage", "pipeline", "owner", "lastContactedAt", "nextAction"],
    )
    identity_lifecycle_score = _score_presence(
        lead,
        ["name", "email", "company", "phone", "role"],
    )
    enterprise_readiness_score = _score_with_bonus(
        _score_presence(
            lead,
            ["company", "role", "employees", "useCase", "budget"],
        ),
        [15 if str(lead.get("tier", "")).lower() in {"enterprise", "whale", "apex"} else 0],
    )

    composite_score = round(
        (
            governance_alignment_score
            + continuity_stability_score
            + identity_lifecycle_score
            + enterprise_readiness_score
        )
        / 4
    )

    score_payload = {
        "score": composite_score,
        "scores": {
            "governanceAlignment": governance_alignment_score,
            "continuityStability": continuity_stability_score,
            "identityLifecycle": identity_lifecycle_score,
            "enterpriseReadiness": enterprise_readiness_score,
        },
        "generatedAt": datetime.now(timezone.utc).isoformat(),
    }
    _whale_state["last_score"] = score_payload
    return score_payload


@router.get("/data")
def whale_data():
    return {
        "ok": True,
        "lastIntake": _whale_state["last_intake"],
        "lastScore": _whale_state["last_score"],
    }
