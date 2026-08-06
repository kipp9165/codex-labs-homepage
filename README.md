# Codex Labs OS

Codex Labs OS is a clean, deterministic static architecture for founder-grade operational clarity.

## Structure
- index.html
- modules.html
- styles.css
- scripts.js
- components/
- data/
- assets/
- config/
- modules/*.html

## Tiers
- Scroll Tier
- License Tier
- Layer Tier
- Pack Tier
- Substrate Tier
- Bundle Tier
- Enterprise Tier
- Meta Tier
- Sovereign Tier
- Totalization Tier

## Deterministic Routing
- modules.html -> modules/{slug}.html
- detail pages -> related modules
- related modules -> upsell surfaces

## Demonstration
This repository includes a deterministic Codex OS carrier implementation with seven executable scenarios.

### Scenarios
- baseline: admissible action path.
- authority_revoked: refusal when authority is revoked.
- conditions_changed: refusal when governed conditions drift.
- alt_route: refusal when an unauthorized alternate route is requested.
- replay: replay detected but not blocked.
- replay_prevent: replay detected and blocked.
- signing: Ed25519 signing and verification evidence.

### Run
1. Copy a scenario input to a run directory as `input.json`.
2. Execute:

```bash
cargo run --release -- scenario runs/<scenario>/input.json runs/<scenario>/
```

### Evidence
Each `runs/<scenario>/` folder contains:
- `input.json`
- `stdout.log`
- `receipt.json`
- `trace.json`
- `notes.md`