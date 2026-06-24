import Stripe from "stripe";

// ---------------------------------------------------------------------------
// Environment validation
// Fail fast with a clear, actionable message rather than a cryptic runtime
// error later in the request lifecycle.
// ---------------------------------------------------------------------------

const REQUIRED_VARS = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];
const missing = REQUIRED_VARS.filter((key) => !process.env[key]);

if (missing.length) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "webhook_config_missing_env",
      missing_vars: missing,
      ts: new Date().toISOString(),
    })
  );
  process.exit(1);
}

const rawPort = Number.parseInt(process.env.PORT || "3000", 10);
if (!Number.isInteger(rawPort) || rawPort < 1 || rawPort > 65535) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "webhook_config_invalid_env",
      var: "PORT",
      value: process.env.PORT,
      ts: new Date().toISOString(),
    })
  );
  process.exit(1);
}

const rawMaxEntries = Number.parseInt(process.env.PRESENCE_LEDGER_MAX_ENTRIES || "5000", 10);
if (!Number.isInteger(rawMaxEntries) || rawMaxEntries < 1) {
  console.error(
    JSON.stringify({
      level: "error",
      message: "webhook_config_invalid_env",
      var: "PRESENCE_LEDGER_MAX_ENTRIES",
      value: process.env.PRESENCE_LEDGER_MAX_ENTRIES,
      ts: new Date().toISOString(),
    })
  );
  process.exit(1);
}

export const config = {
  port: rawPort,
  presenceLedgerMaxEntries: rawMaxEntries,
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});
