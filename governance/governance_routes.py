from fastapi import APIRouter
from governance.governance_controller import (
    governance_invariants,
    governance_rules,
    governance_audit,
)

router = APIRouter()


@router.get("/invariants")
def get_governance_invariants():
    return governance_invariants()


@router.get("/rules")
def get_governance_rules():
    return governance_rules()


@router.get("/audit")
def get_governance_audit():
    return governance_audit()