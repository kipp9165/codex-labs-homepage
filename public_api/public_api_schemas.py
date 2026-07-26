from pydantic import BaseModel

class PublicPayload(BaseModel):
    data: dict | None = None

class PublicResponse(BaseModel):
    status: str | None = None
    diagnostics: dict | None = None
    version: str | None = None
    integrity: str | None = None
    bundle: dict | None = None