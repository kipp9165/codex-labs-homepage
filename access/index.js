import { resolveEntitlements } from "../product-brain/index.js";

const TIMEOUT = 10000;

export async function getUserEntitlements(email) {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), TIMEOUT);
    const res = await fetch(process.env.BASEROW_PURCHASES_URL, {
      headers: { Authorization: `Token ${process.env.BASEROW_API_KEY}` },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) throw new Error(`baserow_error:${res.status}`);
    const data = await res.json();
    const rows = data.results || [];
    const products = rows.filter((r) => r.email === email).map((r) => r.product);
    const entitlements = resolveEntitlements(products);
    return { ok: true, entitlements: [...new Set(entitlements)] };
  } catch (e) {
    console.error("access_error", e.message);
    return { ok: false, error: e.message };
  }
}
