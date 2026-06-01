import Stripe from "stripe";

const required = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error("missing_env_" + key);
  }
}

export const config = {
  port: Number.parseInt(process.env.PORT || "3000", 10),
  presenceLedgerMaxEntries: Number.parseInt(process.env.PRESENCE_LEDGER_MAX_ENTRIES || "5000", 10),
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

if (!Number.isInteger(config.port) || config.port <= 0) {
  throw new Error("invalid_env_PORT");
}

if (!Number.isInteger(config.presenceLedgerMaxEntries) || config.presenceLedgerMaxEntries <= 0) {
  throw new Error("invalid_env_PRESENCE_LEDGER_MAX_ENTRIES");
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});
