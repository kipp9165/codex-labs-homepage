# Substrate Architecture Guide

Substrate is the structural layer beneath tools, workflows, and decisions. This guide describes how to design that layer so systems remain legible as complexity grows. Use it to build durable foundations before adding automation.

## Substrate Principles
- Favor clarity over novelty.
- Design for continuity across personnel changes.
- Separate core invariants from adjustable policies.

## Layer Model
- Define policy layer, process layer, and interface layer.
- Keep cross-layer dependencies explicit.
- Prevent hidden coupling between layers.

## Boundary Design
- Declare where each subsystem starts and stops.
- Use contracts for inputs, outputs, and ownership.
- Reject fuzzy boundaries that invite drift.

## Failure Containment
- Isolate failures to local zones.
- Define rollback and safe mode behavior.
- Preserve decision traceability during incidents.

## Governance Hooks
- Add review gates at structural change points.
- Require approval paths for policy mutations.
- Maintain an architecture log for major shifts.

## Scaling Rules
- Scale by extending modules, not by adding chaos.
- Reassess boundaries before adding new surfaces.
- Keep substrate documents synchronized with reality.
