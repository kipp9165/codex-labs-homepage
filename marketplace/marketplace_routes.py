from fastapi import APIRouter
from marketplace.marketplace_controller import *

router = APIRouter(prefix="/marketplace", tags=["Codex OS Marketplace"])

@router.get("/overview")
def marketplace_overview_route():
    return marketplace_overview()

@router.get("/bundle/{bundle_key}")
def marketplace_bundle_route(bundle_key: str):
    result = marketplace_item(bundle_key)
    if result is None:
        return {"error": "Bundle not found"}
    return result


@router.get("/search")
def marketplace_search_route(query: str = ""):
    return {"results": marketplace_search(query)}