# Domain + Render Deployment Checklist

## DNS Instructions
- Point apex domain `A` records to the Render static site endpoint values.
- Point `www` with a `CNAME` to the Render hostname for the service.
- Remove stale DNS entries that can conflict with Render routing.
- Wait for propagation and verify authoritative DNS answers before final test.

## Render Configuration Steps
- Open the Render service for this repo and confirm static site type.
- Confirm publish directory is `public`.
- Confirm build/deploy settings match the current production baseline.
- Attach the custom domain(s) to this exact service.
- Confirm auto-deploy is enabled for the target branch.

## SSL Verification
- Verify Render has issued an active certificate for apex and `www`.
- Confirm HTTPS loads without warnings for all primary routes.
- Confirm HTTP requests redirect to HTTPS.

## WWW Redirect
- Choose canonical host (apex or `www`) and enforce one-direction redirect.
- Verify `www -> apex` or `apex -> www` is consistent and permanent.

## Deployment Validation
- `https://codex-labs-homepage.onrender.com/index.html`
- `https://codex-labs-homepage.onrender.com/products.html`
- `https://codex-labs-homepage.onrender.com/pricing.html`
- `https://codex-labs-homepage.onrender.com/modules.html`
- `https://codex-labs-homepage.onrender.com/affiliates.html`

## Checkout Validation
- Creator checkout: `https://pay.codexlitigation.org/b/dRm4gzeF1d6t0WIbg4fbD3V`
- Enterprise operating checkout: `https://pay.codexlitigation.org/b/4gM4gz2Wj9UhdJu6ZOfbD3W`
- Enterprise governance checkout: `https://pay.codexlitigation.org/b/fZudR9cwT5E15cYbg4fbD3X`
- Enterprise clarity diagnostic checkout: `https://pay.codexlitigation.org/b/aFa28reF11nL9tefwkfbD3Y`
- Enterprise architecture checkout: `https://pay.codexlitigation.org/b/3cI5kDcwT9UhgVGgAofbD3Z`
- Base tier checkout: `https://pay.codexlitigation.org/b/9B6dR99kHgiF8pa4RGfbD40`
- Sovereign tier checkout: `https://pay.codexlitigation.org/b/eVq7sL54r4zX8paesgfbD41`
- Apex tier checkout: `https://pay.codexlitigation.org/b/6oU14ncwT4zXgVGbg4fbD42`
- Retainer checkout: `https://pay.codexlitigation.org/b/cNi14n54r6I5axi97WfbD43`
- License checkout: `https://pay.codexlitigation.org/b/dRmfZhgN90jH34QdocfbD44`
