# Revenue Dashboard

## Purpose

Build nightly SKU-level revenue analytics from Stripe charges/payment_intents joined with Baserow metadata.

## Script

node scripts/revenue_dashboard.js

## Required Environment

1. STRIPE_SECRET_KEY
2. BASEROW_API_TOKEN
3. BASEROW_TABLE_ID

Optional issue automation:

1. GITHUB_TOKEN
2. GITHUB_REPO

## Outputs

1. analytics/revenue/revenue_latest.json
2. analytics/revenue/revenue_history/{timestamp}.json

## Report Sections

1. revenue_per_sku
2. revenue_per_product_id
3. revenue_per_price_id
4. daily_revenue
5. weekly_revenue
6. top_skus
7. underperforming_skus
8. anomalies

## Anomaly Types

1. sudden_revenue_drop
2. sku_level_collapse
3. zero_revenue_active_funnel

## Workflow

.github/workflows/revenue_dashboard.yml

Runs nightly at 5:00 AM America/New_York (UTC cron + ET gate).
