from fastapi import APIRouter
from marketplace_controller import (
    get_marketplace_overview,
    get_bundle_details
)

router = APIRouter(prefix="/marketplace", tags=["Codex OS Marketplace"])

@router.get("/overview")
def marketplace_overview_route():
    return get_marketplace_overview()

@router.get("/bundle/{bundle_key}")
def marketplace_bundle_route(bundle_key: str):
    result = get_bundle_details(bundle_key)
    if result is None:
        return {"error": "Bundle not found"}
    return result