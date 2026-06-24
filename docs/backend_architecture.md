# Backend Architecture

## Overview

This repository now uses a shared backend architecture for all nightly commerce and analytics jobs.

## Folder Structure

scripts/
  _shared/
    api_helpers.js
    baserow_helpers.js
    github_issues.js
    logging.js
    plausible_helpers.js
    stripe_helpers.js
    time_utils.js
  stripe_to_baserow_sync.js
  commerce_drift_check.js
  payment_link_check.js
  plausible_funnel_report.js
  revenue_dashboard.js

.github/workflows/
  stripe_baserow_sync.yml
  commerce_drift.yml
  payment_link_check.yml
  plausible_funnel.yml
  revenue_dashboard.yml

docs/
  stripe_sync.md
  commerce_drift.md
  payment_link_check.md
  plausible_funnel.md
  revenue_dashboard.md
  backend_architecture.md

analytics/
  funnel/
  revenue/

## Nightly Job Flow

All jobs follow the same execution pattern:

1. checkout repo
2. setup Node 20
3. ET-time gate check
4. npm ci
5. run script
6. upload artifact when report files exist
7. fail-notification step

## Shared Utilities

1. api_helpers.js
   - env validation
   - HTTP JSON wrapper
   - normalization helpers

2. stripe_helpers.js
   - paginated Stripe collection fetch
   - minor-to-major amount normalization

3. baserow_helpers.js
   - paginated Baserow fetch
   - SKU map building
   - row upsert helper

4. github_issues.js
   - open issue title retrieval
   - deduped issue creation

5. plausible_helpers.js
   - Plausible query wrapper

6. time_utils.js
   - ISO timestamps
   - file-safe timestamps
   - unix window helpers

7. logging.js
   - structured log output
   - consistent summary output

## Script Conventions

All backend scripts follow these conventions:

1. async main() entrypoint
2. top-level main().catch fatal handler
3. structured logging via shared logger
4. shared helper imports only for API calls and pagination
5. consistent JSON summary payload at completion

## Adding New Dashboards

1. create a new script in scripts/
2. use shared helpers for external APIs
3. write outputs under analytics/{dashboard}/
4. add a workflow using ET gate + Node 20 + npm ci
5. add docs/{dashboard}.md with env, output, interpretation

## Adding New Anomaly Detectors

1. implement deterministic anomaly function in the target script
2. emit anomaly payloads in report JSON
3. use github_issues.js createIssueWithDedupe
4. label issues for clear triage ownership
5. keep thresholds configurable in script constants

## Validation Checklist

1. node --check for all scripts
2. YAML diagnostics clean for all workflows
3. verify no frontend files are touched
4. verify git status contains only backend architecture paths
