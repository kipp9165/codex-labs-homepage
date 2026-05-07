import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import { fulfillPurchase } from "../fulfillment/index.js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, signature, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("signature_verification_failed");
    return res.status(400).send("Invalid signature");
  }

  res.status(200).send("OK");

  switch (event.type) {
    case "checkout.session.completed":
      console.log("checkout.session.completed");
      (async () => {
        const session = event.data?.object ?? {};
        const email = session.customer_details?.email ?? session.customer_email ?? "";
        const product = session.metadata?.product ?? session.client_reference_id ?? "unknown";
        const price = session.amount_total ?? 0;
        const timestamp = session.created ?? Math.floor(Date.now() / 1000);

        const fulfillment = await fulfillPurchase({ email, product, price, timestamp });
        if (!fulfillment.ok) {
          console.error("fulfillment_error", fulfillment.error);
        }
      })().catch((err) => {
        console.error("fulfillment_error", err);
      });
      break;
    default:
      break;
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("webhook_listening");
});
