from fastapi import APIRouter
from governance.governance_controller import *

router = APIRouter(prefix="/governance", tags=["Codex Governance"])


@router.get("/rules")
def governance_rules_route():
    return governance_rules()


@router.get("/invariants")
def governance_invariants_route():
    return governance_invariants()


@router.get("/audit")
def governance_audit_route():
    return governance_audit()