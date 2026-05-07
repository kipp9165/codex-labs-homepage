import { getUserEntitlements } from "../access/index.js";

const TIMEOUT = 10000;

export async function getCustomerPortalState(email) {
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
    const access = await getUserEntitlements(email);
    const entitlements = access.ok ? access.entitlements : [];
    const portalUrl = `${process.env.CUSTOMER_PORTAL_BASE}?email=${encodeURIComponent(email)}`;
    return { email, products, entitlements, portalUrl };
  } catch (e) {
    console.error("portal_error", e.message);
    return { email, products: [], entitlements: [], portalUrl: "" };
  }
}
