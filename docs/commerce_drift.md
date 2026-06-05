# Commerce Drift Detection

This workflow detects drift between live Stripe commerce data, synced Baserow rows, and the repo checkout mapping in `public/checkout-urls.json`.

## What It Checks

The drift checker compares three sources:

1. Live Stripe products and prices
2. Synced Baserow rows
3. Repository checkout mapping in `public/checkout-urls.json`

It detects:

1. Missing products
2. Missing prices
3. Amount mismatches
4. Currency mismatches
5. Missing payment links
6. Orphaned checkout entries not present in Stripe
7. Baserow rows that are missing or outdated

## Manual Run

From the repository root:

```bash
node scripts/commerce_drift_check.js
```

Required environment variables:

1. `STRIPE_SECRET_KEY`
2. `BASEROW_API_TOKEN`
3. `BASEROW_TABLE_ID`
4. `GITHUB_TOKEN`
5. `GITHUB_REPO`

Optional:

1. `BASEROW_API_BASE` (defaults to `https://api.baserow.io`)

## How GitHub Issues Are Generated

When drift is found, the script opens GitHub Issues using:

`POST https://api.github.com/repos/{GITHUB_REPO}/issues`

Issue titles follow this format:

`Commerce Drift: {type} — {product_id}`

Each issue body includes:

1. `product_id`
2. `price_id`
3. expected values
4. actual values
5. a suggested fix

The script also avoids creating duplicate open issues with the same title.

## How To Resolve Drift

1. Update `public/checkout-urls.json` so it matches Stripe.
2. Re-run the Stripe-to-Baserow sync if the Baserow rows are stale.
3. If the Stripe data is wrong, fix the Stripe product or price first.
4. If a payment link is missing, add the live Stripe Payment Link URL.
5. Close the GitHub Issue after the drift is resolved and re-run the workflow.

## Schedule

Workflow file: `.github/workflows/commerce_drift.yml`

The workflow is scheduled to run nightly at `3:30 AM` Eastern Time using a UTC cron plus an in-job timezone gate.

To adjust or disable the schedule:

1. Edit the cron expression in `.github/workflows/commerce_drift.yml`
2. Change the in-job `America/New_York` time gate if needed
3. Remove the `schedule` block to disable nightly execution

## Troubleshooting

1. Stripe auth errors
   - Confirm `STRIPE_SECRET_KEY` is valid.
2. Baserow auth errors
   - Confirm `BASEROW_API_TOKEN` and `BASEROW_TABLE_ID` are correct.
3. GitHub issue creation fails
   - Confirm `GITHUB_TOKEN` can create issues in the target repo.
4. No issues are created even though drift exists
   - Check for an existing open issue with the same title.
5. Unexpected amount mismatches in checkout JSON
   - Confirm the checkout mapping value is the same unit style used by Stripe and Baserow.
6. Nightly run does not fire
   - Confirm Actions are enabled and the repository schedule is not disabled.
