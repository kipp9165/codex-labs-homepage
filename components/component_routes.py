from fastapi import APIRouter
from components.component_controller import *

router = APIRouter(prefix="/components", tags=["Codex Components"])


@router.get("/registry")
def component_registry_route():
    return component_registry()


@router.get("/{name}")
def component_info_route(name: str):
    return component_info(name)


@router.get("/{name}/metrics")
def component_metrics_route(name: str):
    return component_metrics(name)