# Plausible Funnel Reporting

This workflow generates a nightly conversion funnel report from Plausible stats and writes the result to the repository analytics folder.

## Event Schema

The funnel report expects these event names:

1. `page_view`
2. `cta_click`
3. `checkout_redirect`
4. `checkout_success`

Event intent:

1. `page_view` is the impression layer.
2. `cta_click` is emitted from `.buy-button` clicks.
3. `checkout_redirect` is emitted when a user is sent to Stripe Payment Link checkout.
4. `checkout_success` is emitted by the Stripe webhook path after a successful payment.

## Manual Run

From the repository root:

```bash
node scripts/plausible_funnel_report.js
```

Required environment variables:

1. `PLAUSIBLE_API_KEY`
2. `PLAUSIBLE_SITE_ID`

Optional for GitHub alerts:

1. `GITHUB_TOKEN`
2. `GITHUB_REPO`

## Output Files

The script writes reports to:

1. `analytics/funnel_latest.json`
2. `analytics/funnel_history/{timestamp}.json`

`funnel_latest.json` is the current roll-up. The history folder keeps a timestamped archive for trend analysis.

## How To Interpret funnel_latest.json

The report contains:

1. total page views
2. total CTA clicks
3. total checkout redirects
4. total checkout successes
5. funnel rates:
   - `cta_rate`
   - `redirect_rate`
   - `success_rate`
6. SKU-level breakdown by:
   - `product_id`
   - `price_id`

The baseline fields provide a 7-day reference window for comparison.

## How Anomaly Detection Works

The script compares the latest 24-hour window with a 7-day baseline.

It alerts on:

1. sudden drop in CTA clicks
2. sudden drop in redirect rate
3. sudden drop in checkout success
4. SKU-level drops for the same metrics

When alerts are enabled, the script opens GitHub Issues with the anomaly summary, expected values, actual values, and suggested fixes.

## How GitHub Issues Are Generated

When drift is detected and `GITHUB_TOKEN` plus `GITHUB_REPO` are provided, the script calls:

`POST https://api.github.com/repos/{GITHUB_REPO}/issues`

The issue title follows the format:

`Funnel Anomaly: {metric} dropped`

The issue body includes the report snapshot, the 7-day baseline, and the suggested fix.

## How To Disable Alerts

1. Remove `GITHUB_TOKEN` and `GITHUB_REPO` from the workflow secrets.
2. Or leave the secrets unset when running locally.
3. The report will still be generated without opening issues.

## Schedule

Workflow file: `.github/workflows/plausible_funnel.yml`

The workflow is scheduled to run nightly at 4:00 AM Eastern Time using a UTC cron plus an in-job timezone gate.

To adjust the schedule:

1. Edit the cron expression in `.github/workflows/plausible_funnel.yml`
2. Change the `America/New_York` gate time if needed
3. Remove the `schedule` block to disable nightly runs entirely
