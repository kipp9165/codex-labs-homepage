# Stripe to Baserow Sync

## Purpose

Sync Stripe products/prices into Baserow as the canonical backend SKU metadata table.

## Script

node scripts/stripe_to_baserow_sync.js

## Required Environment

1. STRIPE_SECRET_KEY
2. BASEROW_API_TOKEN
3. BASEROW_TABLE_ID

Optional:

1. BASEROW_API_BASE

## Behavior

1. Fetches paginated Stripe products and prices.
2. Normalizes each Stripe price row to product_id + price_id payload.
3. Fetches existing Baserow rows with pagination.
4. Upserts each row by composite key product_id::price_id.
5. Emits structured summary output.

## Workflow

.github/workflows/stripe_baserow_sync.yml

Runs nightly at 3:00 AM America/New_York (UTC cron + ET gate).
