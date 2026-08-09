# Codex Q/A v2.0 — Logging Standards

## Log Format
{
  "trace_id": "<deterministic>",
  "route": "/api/...",
  "status": 200,
  "latency_ms": 12,
  "payload": { ... }
}

## Requirements
- JSON only
- Deterministic trace IDs
- No timestamps in logic paths
- No randomness
- No PII

## Log Levels
- info
- warn
- error

## Observability Guarantees
- Replay-safe logs
- Deterministic trace IDs
- No drift across executions
