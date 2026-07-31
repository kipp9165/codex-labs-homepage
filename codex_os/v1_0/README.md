# Codex OS v1.0

Codex OS v1.0 is a deterministic founder-grade operating substrate composed of constitutional, governance, drift, runtime, orchestration, stability, replay, simulation, commerce, and trust layers.

## Determinism Contract

1. No module in this package reads wall-clock time.
2. No module in this package uses randomness.
3. The same input payload yields the same output payload.

## Entry Point

- Python API: `build_codex_os_v1_snapshot` in `system.py`
