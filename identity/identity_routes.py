from fastapi import APIRouter
from identity.identity_controller import *

router = APIRouter(prefix="/identity", tags=["Codex Identity"])


@router.get("/envelope")
def identity_envelope_route():
    return identity_envelope()


@router.get("/profile/{user_id}")
def identity_profile_route(user_id: str):
    return identity_profile(user_id)


@router.get("/permissions/{user_id}")
def identity_permissions_route(user_id: str):
    return identity_permissions(user_id)