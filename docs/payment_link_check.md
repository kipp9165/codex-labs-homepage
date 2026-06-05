# Payment Link Completeness Checker

This checker validates that checkout data is complete and that each Payment Link uses Stripe's expected format.

## What It Validates

The script reads `public/checkout-urls.json` and validates:

1. each product entry has a valid `product_id` key
2. each product has at least one price entry
3. each price entry has:
   - `price_id`
   - `amount`
   - `currency`
   - `payment_link_url`
4. each `payment_link_url` is non-empty
5. placeholders are flagged (for example values containing `TODO` or `REPLACE`)
6. each `payment_link_url` matches Stripe format: `https://pay.stripe.com/*`

Optional cross-check:

1. if `BASEROW_API_TOKEN` and `BASEROW_TABLE_ID` are provided, the script compares checkout rows with Baserow rows
2. mismatches are included in `baserow_mismatches`

The script emits a report with these arrays:

1. `missing_links`
2. `placeholder_links`
3. `malformed_links`
4. `orphaned_prices`
5. `baserow_mismatches`

## Manual Run

From repository root:

```bash
node scripts/payment_link_check.js
```

Environment variables:

1. `GITHUB_TOKEN` (required to open issues)
2. `GITHUB_REPO` (required to open issues, format: owner/repo)
3. `BASEROW_API_TOKEN` (optional)
4. `BASEROW_TABLE_ID` (optional)

No secrets are hardcoded in the script.

## How GitHub Issues Are Generated

When `GITHUB_TOKEN` and `GITHUB_REPO` are set, the script:

1. fetches open issues
2. dedupes by issue title
3. creates issues for:
   - missing payment links
   - placeholder payment links
   - malformed payment links
   - orphaned price entries

API used:

`POST https://api.github.com/repos/{GITHUB_REPO}/issues`

Auth header used:

`Authorization: token {GITHUB_TOKEN}`

## How To Fix Missing or Invalid Payment Links

1. open `public/checkout-urls.json`
2. locate the product and price entry from the reported `product_id` and `price_id`
3. replace placeholder or malformed value with the real Stripe Payment Link URL
4. verify the URL starts with `https://pay.stripe.com/`
5. run `node scripts/payment_link_check.js` again

## Nightly Schedule

Workflow file: `.github/workflows/payment_link_check.yml`

The workflow runs nightly at 4:30 AM Eastern Time using UTC cron plus an in-job timezone gate.

To adjust or disable:

1. edit cron values in `.github/workflows/payment_link_check.yml`
2. update the `America/New_York` gate condition if you change local execution time
3. remove the `schedule` block to disable nightly runs entirely
