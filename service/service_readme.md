# Codex OS Cloud Deployment v1 — Render

This deployment configuration launches Codex OS Runtime Service v1 on Render.

## Features
- FastAPI runtime service
- Automatic deployment
- Health checks
- Python 3.11 environment
- Public API endpoints

## Deployment
Render automatically builds and deploys the service using:
- `pip install -r requirements.txt`
- `cd service && uvicorn main:app --host 0.0.0.0 --port 10000`

Codex OS is now deployable as a cloud API.