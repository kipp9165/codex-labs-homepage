# Codex OS v2.0 - Constitutional Intelligence API Reference

## 1. Overview
The Constitutional Intelligence API exposes the Constitutional Intelligence Layer (CIL) for:
- Intent interpretation
- Authority gradient analysis
- Legitimacy horizon modeling
- Cross-constitutional arbitration
- Constitutional drift analysis

Base path:
- /cil/v2

## 2. Endpoints

### 2.1 /cil/v2/intent/analyze
Method: POST
Description: Analyze constitutional intent for a proposed action.

Request body:
- action_id: string
- actor_id: string
- domain: string
- payload: object

Response:
- intent_origin: string
- intent_domain: string
- intent_authority: string
- intent_legitimacy: number
- intent_confidence: number

### 2.2 /cil/v2/authority/gradient
Method: POST
Description: Compute authority gradient across domains and roles.

Request body:
- actor_id: string
- domains: string[]
- roles: string[]

Response:
- authority_vector: object
- authority_slope: number
- authority_confidence: number

### 2.3 /cil/v2/legitimacy/horizon
Method: POST
Description: Model legitimacy horizon over time and drift.

Request body:
- action_id: string
- initial_legitimacy: number
- time_window: string
- drift_profile: object

Response:
- legitimacy_score: number
- legitimacy_decay: number
- legitimacy_horizon: string
- legitimacy_confidence: number

### 2.4 /cil/v2/arbitration/resolve
Method: POST
Description: Resolve cross-constitutional conflicts.

Request body:
- surfaces: string[]
- conflicts: object[]
- preferred_surface: string (optional)

Response:
- arbitration_surface: string
- arbitration_resolution: object
- arbitration_legitimacy: number
- arbitration_confidence: number

### 2.5 /cil/v2/drift/analyze
Method: POST
Description: Analyze constitutional, authority, temporal, and legitimacy drift.

Request body:
- action_id: string
- governance_state_before: object
- governance_state_after: object

Response:
- temporal_entropy: number
- constitutional_delta: number
- authority_delta: number
- legitimacy_delta: number

## 3. Error Model
Standard error:
- error_code: string
- error_message: string
- error_details: object (optional)

## 4. Versioning
Current version: v2
Backward-compatible with v1.x governance and drift fields.
New constitutional fields are additive and optional.

## 5. Usage Notes
- Use intent/analyze before runtime execution for pre-admissibility checks.
- Use authority/gradient and legitimacy/horizon for governance dashboards.
- Use arbitration/resolve for multi-surface governance conflicts.
- Use drift/analyze for post-execution legitimacy and authority analysis.
