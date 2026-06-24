# Plausible Funnel Report

## Purpose

Generate nightly funnel metrics from Plausible and write versioned analytics artifacts.

## Script

node scripts/plausible_funnel_report.js

## Required Environment

1. PLAUSIBLE_API_KEY
2. PLAUSIBLE_SITE_ID

Optional issue automation:

1. GITHUB_TOKEN
2. GITHUB_REPO

## Outputs

1. analytics/funnel/funnel_latest.json
2. analytics/funnel/funnel_history/{timestamp}.json

## Metrics

1. page_views
2. cta_clicks
3. checkout_redirects
4. checkout_successes
5. cta_rate
6. redirect_rate
7. success_rate
8. sku_breakdown

## Workflow

.github/workflows/plausible_funnel.yml

Runs nightly at 4:00 AM America/New_York (UTC cron + ET gate).
