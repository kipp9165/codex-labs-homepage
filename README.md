# Codex Labs Homepage

Static homepage and product surface for Codex Labs.

## Run Locally

This repo is intentionally static. Start a local preview with:

```bash
node scripts/static-server.js
```

If you prefer npm, use `npm start` from a shell that allows the npm shim, or `npm.cmd start` on Windows PowerShell.

## Build

There is no build step. The site is published directly from `public/`.

## Deploy To Render

The repository is already configured as a static site in `render.yaml`:

- `publishDir: public`
- `buildCommand: ""`

The webhook service in `render.yaml` remains separate and uses `webhook/` as its root.

## Validation Checklist

The following pages should load without browser console errors during local verification:

- `/index.html`
- `/pricing.html`
- `/verticals.html`
- `/bundles.html`
- `/store/index.html`
- `/store/custom-scroll.html`
- `/store/modules.html`
- `/store/passes.html`
- `/console/index.html`
- `/scrolls/index.html`

Plausible analytics is loaded on the key pages with domain `codex-labs-homepage-4.onrender.com`.

Final wiring verification completed: all key routes validated, Plausible and checkout wiring confirmed, no remaining broken links or duplicated analytics.