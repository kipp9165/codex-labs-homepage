from fastapi import APIRouter
from public_api.public_api_controller import (
    public_status,
    public_health,
    public_version,
)

router = APIRouter()


@router.get("/status")
def get_public_status():
    return public_status()


@router.get("/health")
def get_public_health():
    return public_health()


@router.get("/version")
def get_public_version():
    return public_version()