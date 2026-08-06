# Codex OS v2.0 - Service Manifest

Service name:
- Codex OS Runtime Service v2.0

Description:
- Constitutional intelligence-enabled runtime for Codex OS, exposing governance, drift, simulation, commerce, and trust APIs.

Entry point:
- service/codex_os_service.py

Runtime stack:
- FastAPI (application layer)
- Uvicorn / ASGI (server)
- Render Web Service (deployment)

Exposed routers:
- /marketplace -> Marketplace APIs
- /identity -> Identity and envelopes
- /governance -> Governance v20-v23 APIs
- /public_api -> Public-facing runtime APIs
- /runtime/v2 -> Autonomous Runtime v20 Series
- /simulation/v2 -> Constitutional Simulation Tier
- /commerce/v2 -> Commerce Layer v2.0
- /trust/v2 -> Trust Layer v2.0
- /cil/v2 -> Constitutional Intelligence Layer APIs
- / -> Root health/status endpoint

Health and status:
- Root: GET / -> { "status": "Codex OS Runtime v2.0", "alive": true }
- Optional: GET /public_api/status -> extended health payload

Versioning:
- Current: v2.0
- Backward-compatible with v1.x governance and drift fields
- New constitutional fields are additive and optional

Dependencies (conceptual):
- Persistence layer (state, receipts, provenance)
- Logging/observability backend
- Configuration for governance/drift thresholds

Operational notes:
- All v2.0 endpoints aligned with API_INDEX_V2_0.md
- Root route must remain stable for external health checks
- Governance and drift endpoints should be monitored for latency and error rates
