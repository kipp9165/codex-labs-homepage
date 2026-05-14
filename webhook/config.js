import Stripe from "stripe";

const required = ["STRIPE_SECRET_KEY", "STRIPE_WEBHOOK_SECRET"];

for (const key of required) {
  if (!process.env[key]) {
    throw new Error("missing_env_" + key);
  }
}

export const config = {
  port: Number.parseInt(process.env.PORT || "3000", 10),
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
};

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2025-03-31.basil",
});
