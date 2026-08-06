from fastapi import FastAPI
from pydantic import BaseModel

from codex_os.codex.os.os_api import codex_os_boot, codex_os_shutdown
from codex_os.codex.os.runtime_api import os_runtime, os_runtime_shutdown
from codex_os.codex.os.distribution_api import os_distribution, os_distribution_shutdown
from codex_os.codex.os.finalization_api import os_finalize, os_finalize_shutdown
from codex_os.codex.os.completion_api import os_complete, os_complete_shutdown
from marketplace.marketplace_routes import router as marketplace_router
from identity.identity_routes import router as identity_router
from governance.governance_routes import router as governance_router
from public_api.public_api_routes import router as public_api_router

app = FastAPI(
    title="Codex OS Runtime Service v2.0",
    version="2.0",
)


@app.get("/")
def root():
    return {"status": "Codex OS Runtime v2.0", "alive": True}


app.include_router(marketplace_router, tags=["Marketplace"])
app.include_router(identity_router, prefix="/identity", tags=["Identity"])
app.include_router(governance_router, prefix="/governance", tags=["Governance"])
app.include_router(public_api_router, prefix="/public_api", tags=["Public API"])

class Payload(BaseModel):
    data: dict | None = None

@app.post("/os_boot")
def os_boot_endpoint(payload: Payload | None = None):
    body = payload.data if payload else {}
    return codex_os_boot(body or {})

@app.post("/os_shutdown")
def os_shutdown_endpoint():
    return codex_os_shutdown()

@app.post("/os_runtime")
def os_runtime_endpoint(payload: Payload):
    return os_runtime(payload.data or {})

@app.post("/os_runtime_shutdown")
def os_runtime_shutdown_endpoint():
    return os_runtime_shutdown()

@app.post("/os_distribution")
def os_distribution_endpoint(payload: Payload):
    return os_distribution(payload.data or {})

@app.post("/os_distribution_shutdown")
def os_distribution_shutdown_endpoint():
    return os_distribution_shutdown()

@app.post("/os_finalize")
def os_finalize_endpoint(payload: Payload):
    return os_finalize(payload.data or {})

@app.post("/os_finalize_shutdown")
def os_finalize_shutdown_endpoint():
    return os_finalize_shutdown()

@app.post("/os_complete")
def os_complete_endpoint(payload: Payload):
    return os_complete(payload.data or {})

@app.post("/os_complete_shutdown")
def os_complete_shutdown_endpoint():
    return os_complete_shutdown()