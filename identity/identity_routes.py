from fastapi import APIRouter
from identity.identity_controller import (
    identity_envelope,
    identity_profile,
    identity_permissions,
)

router = APIRouter()


@router.get("/envelope")
def get_identity_envelope():
    return identity_envelope()


@router.get("/profile")
def get_identity_profile():
    return identity_profile()


@router.get("/permissions")
def get_identity_permissions():
    return identity_permissions()