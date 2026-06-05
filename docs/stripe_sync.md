# Stripe to Baserow Nightly Sync

This sync keeps Stripe product/price data aligned in Baserow for operational consistency, SKU drift detection, and Payment Link completeness.

## Required GitHub Secrets

Set these repository secrets in GitHub:

1. `STRIPE_SECRET_KEY`
2. `BASEROW_API_TOKEN`
3. `BASEROW_TABLE_ID`

Optional:

1. `BASEROW_API_BASE` (defaults to `https://api.baserow.io`)

GitHub path:

1. Repository Settings
2. Secrets and variables
3. Actions
4. New repository secret

## Manual Run

From repository root:

```bash
node scripts/stripe_to_baserow_sync.js
```

Required environment variables must be set before running locally.

## Expected Baserow Schema

Create a table with these field names (exactly):

1. `product_id` (text)
2. `product_name` (text)
3. `price_id` (text)
4. `amount` (number)
5. `currency` (text)
6. `active` (boolean)
7. `livemode` (boolean)
8. `created` (number)
9. `updated` (number)

The script performs upsert behavior using `product_id + price_id` as the unique key.

## How It Works

1. Fetches all Stripe products with pagination.
2. Fetches all Stripe prices with pagination.
3. Joins prices to products by `product.id`.
4. Normalizes rows into the required schema.
5. Reads all existing Baserow rows with pagination.
6. Updates existing rows or inserts missing rows.
7. Logs a summary:
   - `synced_count`
   - `updated_count`
   - `errors_count`

## Nightly Schedule

Workflow file: `.github/workflows/stripe_baserow_sync.yml`

The workflow is scheduled daily and gated in-job to run only at `03:00` in `America/New_York`.

## Troubleshooting

1. `Missing required environment variable`
   - Verify all required env vars/secrets are set.
2. Stripe API auth errors
   - Confirm `STRIPE_SECRET_KEY` is valid and has product/price read scope.
3. Baserow 401/403 errors
   - Confirm `BASEROW_API_TOKEN` has access to the target table.
4. Baserow 400 errors
   - Confirm field names and field types match the expected schema.
5. Duplicate row behavior
   - Ensure existing rows include both `product_id` and `price_id` values.
6. Workflow failure notifications
   - Ensure GitHub notifications are enabled for Actions failures.
