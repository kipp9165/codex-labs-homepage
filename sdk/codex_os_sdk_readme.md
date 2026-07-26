# Codex OS SDK v1

This SDK provides a clean developer interface for interacting with Codex OS.

## Features
- Boot Codex OS
- Run Codex OS runtime
- Build distribution bundles
- Finalize OS bundles
- Complete OS lifecycle

## Usage

```python
from codex_os_sdk_client import CodexOSClient

client = CodexOSClient("https://your-codex-os-service")

result = client.boot({"action": "start"})
print(result)
Codex OS SDK v1 is the official developer access layer for Codex OS.

────────────────────────────────────────

1. Add codex_os_sdk_manifest.json (new file)
────────────────────────────────────────
Create file:
sdk/codex_os_sdk_manifest.json

Insert exactly:

{
"sdk": "Codex OS SDK v1",
"version": "1.0",
"components": [
"codex_os_sdk_client",
"codex_os_sdk_endpoints",
"codex_os_sdk_utils"
],
"entrypoints": [
"codex_os_sdk_client.CodexOSClient"
]
}

────────────────────────────────────────

1. Provide commit message
────────────────────────────────────────
After completing all changes, output this commit message:

"Codex OS SDK v1 — Added official developer SDK with client, endpoints, utilities, manifest, and documentation."

END OF TASK

Code

```

---

When the Agent finishes, tell me:

**batch executed**

Then I will immediately generate:

# ⭐ Codex OS Runtime Service v1 (FastAPI or Flask — your choice)  

This will make Codex OS callable as a cloud service.