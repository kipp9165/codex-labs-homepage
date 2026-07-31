# Operator Runbook

## Startup

1. Validate policy context.
2. Build full snapshot via `build_codex_os_v1_snapshot`.
3. Confirm governance, drift, runtime, stability, and authenticity dispositions.

## Runtime Control

1. If `ORCHESTRATE_GO`, permit execution.
2. If `ORCHESTRATE_REVIEW`, hold execution and escalate.

## Shutdown

1. Archive snapshot.
2. Attach provenance chain output to archive.
