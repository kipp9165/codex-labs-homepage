# Commerce Drift Check

## Purpose

Detect drift across checkout data, Stripe catalog data, and Baserow metadata.

## Script

node scripts/commerce_drift_check.js

## Required Environment

1. STRIPE_SECRET_KEY
2. BASEROW_API_TOKEN
3. BASEROW_TABLE_ID

Optional issue automation:

1. GITHUB_TOKEN
2. GITHUB_REPO

## Drift Categories

1. checkout_missing_in_stripe
2. stripe_missing_in_checkout
3. checkout_missing_in_baserow
4. baserow_missing_in_checkout
5. field_mismatches

## Issue Dedupe

Open GitHub issues are fetched first and deduped by issue title.

## Workflow

.github/workflows/commerce_drift.yml

Runs nightly at 3:30 AM America/New_York (UTC cron + ET gate).
