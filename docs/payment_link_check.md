# Payment Link Check

## Purpose

Validate Payment Link completeness and Stripe link format integrity in checkout metadata.

## Script

node scripts/payment_link_check.js

## Optional Environment

1. BASEROW_API_TOKEN
2. BASEROW_TABLE_ID
3. GITHUB_TOKEN
4. GITHUB_REPO

## Validations

1. product_id exists
2. prices array exists and includes entries
3. each entry has price_id
4. each entry has amount and currency
5. payment_link_url is non-empty
6. payment_link_url is not placeholder text
7. payment_link_url matches https://pay.stripe.com/*

## Report Arrays

1. missing_links
2. placeholder_links
3. malformed_links
4. orphaned_prices
5. baserow_mismatches

## Workflow

.github/workflows/payment_link_check.yml

Runs nightly at 4:30 AM America/New_York (UTC cron + ET gate).
