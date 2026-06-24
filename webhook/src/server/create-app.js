import express from "express";
import { routeStripeEvent } from "../application/event-router.js";

export function createApp({ config, logger, presenceLedger, runtime, stripe }) {
  const app = express();

  app.get("/healthz", (_req, res) => {
    res.status(200).json(runtime.healthSummary());
  });

  app.post("/webhook", express.raw({ type: "application/json" }), (req, res) => {
    const signature = req.headers["stripe-signature"];

    if (!signature || typeof signature !== "string") {
      logger.warn("missing_stripe_signature", {});
      return res.status(400).send("Invalid signature");
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, signature, config.stripeWebhookSecret);
    } catch (err) {
      logger.warn("signature_verification_failed", {
        error: err instanceof Error ? err.message : "unknown",
      });
      return res.status(400).send("Invalid signature");
    }

    if (presenceLedger.has(event.id)) {
      logger.info("webhook_event_duplicate", { id: event.id, type: event.type });
      return res.status(200).send("OK");
    }

    presenceLedger.add(event.id);
    res.status(200).send("OK");

    routeStripeEvent({ event, runtime });
  });

  return app;
}
