# Codex OS v2.0 - API Index (Unified Reference)

## Overview
This index provides a single, consolidated reference to all Codex OS v2.0 API surfaces, grouped by constitutional intelligence, governance, drift, runtime, simulation, commerce, and trust layers.

## 1. Constitutional Intelligence Layer (CIL) APIs
Base path: `/cil/v2`

### Intent and Reasoning
- **POST** `/cil/v2/intent/analyze`
  Constitutional intent interpretation.

### Authority Modeling
- **POST** `/cil/v2/authority/gradient`
  Authority gradient computation.

### Legitimacy Forecasting
- **POST** `/cil/v2/legitimacy/horizon`
  Legitimacy horizon modeling.

### Cross-Constitutional Arbitration
- **POST** `/cil/v2/arbitration/resolve`
  Multi-surface governance conflict resolution.

### Constitutional Drift Analysis
- **POST** `/cil/v2/drift/analyze`
  Drift analysis across constitutional, authority, temporal, and legitimacy surfaces.

## 2. Governance v20-v23 APIs
Base path: `/governance/v2`

### Governance v20 - Constitutional Intent
- **POST** `/governance/v2/intent/validate`

### Governance v21 - Authority Gradient
- **POST** `/governance/v2/authority/compute`

### Governance v22 - Legitimacy Continuum
- **POST** `/governance/v2/legitimacy/score`

### Governance v23 - Cross-Constitutional Arbitration
- **POST** `/governance/v2/arbitration/evaluate`

## 3. Drift Engines v20-v23 APIs
Base path: `/drift/v2`

### Drift v20 - Temporal Entropy
- **POST** `/drift/v2/entropy/calc`

### Drift v21 - Constitutional Drift
- **POST** `/drift/v2/constitutional/delta`

### Drift v22 - Authority Drift
- **POST** `/drift/v2/authority/delta`

### Drift v23 - Legitimacy Drift
- **POST** `/drift/v2/legitimacy/delta`

## 4. Autonomous Runtime v20 Series APIs
Base path: `/runtime/v2`

### Constitutional Bundles
- **POST** `/runtime/v2/bundle/execute`

### Fallback Routes
- **POST** `/runtime/v2/fallback/route`

### Checkpoint Receipts
- **POST** `/runtime/v2/checkpoint/receipt`

## 5. Constitutional Simulation Tier APIs
Base path: `/simulation/v2`

### Tier Simulation
- **POST** `/simulation/v2/tier/run`

### Tier Drift Modeling
- **POST** `/simulation/v2/tier/drift`

### Tier Arbitration
- **POST** `/simulation/v2/tier/arbitrate`

## 6. Commerce Layer v2.0 APIs
Base path: `/commerce/v2`

### Constitutional Pricing
- **POST** `/commerce/v2/pricing/calc`

### Product Registry
- **POST** `/commerce/v2/registry/register`

### Founder Override v3
- **POST** `/commerce/v2/founder/override`

## 7. Trust Layer v2.0 APIs
Base path: `/trust/v2`

### Constitutional Provenance
- **POST** `/trust/v2/provenance/trace`

### Authenticity Engine v4
- **POST** `/trust/v2/auth/verify`

### Receipt Verification v4
- **POST** `/trust/v2/receipt/verify`

## 8. Compatibility and Versioning
- All v2.0 APIs are backward-compatible with v1.x governance and drift fields.
- Constitutional fields are additive and optional.
- Arbitration and legitimacy forecasting require v20-v23 fields for full fidelity.

## 9. Runtime Service
Live runtime:
`https://codex-os-runtime-service.onrender.com`
