const DEFAULT_RENDER_ORIGIN = "https://codex-labs-homepage.onrender.com";
const DEFAULT_QA_PRODUCT_NAME = "Codex Q/A v2.0 — Universal Constitutional Responder";

function parsePort(value, fallback = 3000) {
  const parsed = Number.parseInt(String(value ?? ""), 10);
  return Number.isFinite(parsed) ? parsed : fallback;
}

const config = {
  baserowApiKey: process.env.BASEROW_API_KEY || process.env.BASEROW_API_TOKEN || "",
  baserowTableId: process.env.BASEROW_TABLE_ID || "",
  baserowBaseUrl: process.env.BASEROW_BASE_URL || "https://api.baserow.io",
  stripeSecretKey: process.env.STRIPE_SECRET_KEY || "",
  stripeProductName: process.env.STRIPE_QA_PRODUCT_NAME || DEFAULT_QA_PRODUCT_NAME,
  whaleBypassReference: process.env.WHALE_BYPASS_REFERENCE || "",
  renderPort: parsePort(process.env.PORT || process.env.RENDER_PORT, 3000),
  renderOrigin: process.env.RENDER_EXTERNAL_URL || process.env.QA_RENDER_ORIGIN || DEFAULT_RENDER_ORIGIN,
};

export default config;
export { DEFAULT_QA_PRODUCT_NAME, DEFAULT_RENDER_ORIGIN, config };
