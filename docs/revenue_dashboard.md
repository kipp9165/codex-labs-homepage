# Revenue Dashboard

The revenue dashboard generator builds nightly SKU-level revenue analytics from Stripe charges/payment intents, with optional anomaly alert issues.

## Manual Run

From repository root:

```bash
node scripts/revenue_dashboard.js
```

Required environment variables:

1. STRIPE_SECRET_KEY
2. BASEROW_API_TOKEN
3. BASEROW_TABLE_ID

Optional environment variables (for GitHub Issue alerts):

1. GITHUB_TOKEN
2. GITHUB_REPO

## Output Files

The script writes:

1. analytics/revenue/revenue_latest.json
2. analytics/revenue/revenue_history/{timestamp}.json

The latest report is always overwritten; the history folder keeps timestamped snapshots.

## Report Structure

The report includes:

1. totals
   1. charge_count
   2. total_revenue
2. normalized_rows_sample
3. revenue_per_sku
4. revenue_per_product_id
5. revenue_per_price_id
6. daily_revenue
7. weekly_revenue
8. top_skus
9. underperforming_skus
10. anomalies

## How To Interpret The Dashboard

1. revenue_per_sku: best for SKU-level contribution and conversion monetization checks.
2. revenue_per_product_id: best for product family performance.
3. revenue_per_price_id: best for pricing-tier performance.
4. daily_revenue: trendline for day-over-day movement.
5. weekly_revenue: rolling 7-day total for operational pulse.
6. top_skus: current leaders by revenue.
7. underperforming_skus: active catalog entries with zero observed revenue.

## Anomaly Detection

The generator checks for:

1. sudden_revenue_drop
   1. today revenue significantly below recent baseline
2. sku_level_collapse
   1. SKU revenue collapse compared with baseline
3. zero_revenue_active_funnel
   1. active Baserow SKU metadata with zero observed revenue

When optional GitHub variables are set, issues are created and deduped by title.

## Schedule

Workflow file:

.github/workflows/revenue_dashboard.yml

Nightly schedule target:

1. 5:00 AM America/New_York
2. implemented via UTC cron + in-job timezone gate

## Adjusting Or Disabling

1. Edit cron schedule in .github/workflows/revenue_dashboard.yml.
2. Update the in-job ET hour/minute gate when changing local run time.
3. Remove schedule block to disable nightly automation.
