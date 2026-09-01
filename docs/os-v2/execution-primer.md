# Codex Labs OS v2.0 — Execution Primer

## Purpose
The Execution Primer provides operational guidance for executing tasks within Codex Labs OS v2.0. It supplements the System Primer with execution-specific protocols, sequencing rules, and failure-handling procedures.

## Execution Metadata

```json
{
  "primer-version": "v2.0-final",
  "execution-model": "deterministic-sequential",
  "failure-policy": "halt-and-escalate",
  "retry-policy": "governed",
  "priority-model": "founder-first",
  "founder-grade": true
}
```

## Execution Protocol

### Step 1 — Authority Check
Verify that the executing party holds the required entitlement for the requested operation.

### Step 2 — Governance Gate
Validate the operation against the Governance Layer. Non-compliant operations halt immediately.

### Step 3 — QA Gate
Pass the operation through the Q/A v2.0 Governed Execution Layer.

### Step 4 — Priority Routing
Route the operation according to the Priority Routing Specification.

### Step 5 — Execution
Execute the operation deterministically.

### Step 6 — Continuity Update
Update all relevant continuity channels with the operation result.

### Step 7 — Audit Log
Record the operation in the governance audit log.

## Failure Handling

| Failure Type | Response |
|-------------|----------|
| Authority violation | Halt, log, escalate to Founder |
| Governance violation | Halt, log, governance review |
| QA failure | Halt, log, escalation queue |
| Runtime error | Halt, governed rollback, continuity restore |
| Continuity break | Emergency continuity restore protocol |

END EXECUTION PRIMER.
