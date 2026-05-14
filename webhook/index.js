import express from "express";
import { config, stripe } from "./config.js";
const app = express();
const processedEvents = new Set();

function logEvent(level, message, context) {
  var payload = {
    level: level,
    message: message,
    context: context || {},
    ts: new Date().toISOString(),
  };
  console.log(JSON.stringify(payload));
}

app.get("/healthz", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["stripe-signature"];

  if (!signature || typeof signature !== "string") {
    logEvent("warn", "missing_stripe_signature", {});
    return res.status(400).send("Invalid signature");
  }

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret);
  } catch (err) {
    logEvent("warn", "signature_verification_failed", {
      error: err instanceof Error ? err.message : "unknown",
    });
    return res.status(400).send("Invalid signature");
  }

  if (processedEvents.has(event.id)) {
    logEvent("info", "webhook_event_duplicate", { id: event.id, type: event.type });
    return res.status(200).send("OK");
  }

  processedEvents.add(event.id);
  res.status(200).send("OK");

  switch (event.type) {
    case "checkout.session.completed":
      logEvent("info", "checkout_session_completed", {
        id: event.id,
        session_id: event.data?.object?.id || "",
      });
      break;
    default:
      logEvent("info", "webhook_event_ignored", { id: event.id, type: event.type });
      break;
  }

  if (processedEvents.size > 5000) {
    processedEvents.clear();
  }
});

app.listen(config.port, () => {
  logEvent("info", "webhook_listening", { port: config.port });
});
