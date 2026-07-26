from fastapi import APIRouter
from public_api.public_api_schemas import PublicPayload, PublicResponse
from public_api.public_api_controller import *

router = APIRouter(prefix="/api/v1", tags=["Codex OS Public API"])

@router.post("/boot", response_model=PublicResponse)
def boot_route(payload: PublicPayload):
    result = public_boot(payload.data or {})
    return PublicResponse(status=result["os_state"])

@router.post("/runtime", response_model=PublicResponse)
def runtime_route(payload: PublicPayload):
    result = public_runtime(payload.data or {})
    return PublicResponse(diagnostics=result["runtime_state"])

@router.post("/distribution", response_model=PublicResponse)
def distribution_route(payload: PublicPayload):
    result = public_distribution(payload.data or {})
    return PublicResponse(bundle=result)

@router.post("/finalize", response_model=PublicResponse)
def finalize_route(payload: PublicPayload):
    result = public_finalize(payload.data or {})
    return PublicResponse(bundle=result, version=result["version_stamp"])

@router.post("/complete", response_model=PublicResponse)
def complete_route(payload: PublicPayload):
    result = public_complete(payload.data or {})
    return PublicResponse(
        bundle=result,
        version=result["version_seal"],
        integrity=result["integrity_envelope"]
    )


@router.get("/status")
def status_route():
    return public_status()


@router.get("/health")
def health_route():
    return public_health()


@router.get("/version")
def version_route():
    return public_version()