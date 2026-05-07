import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";
import { fulfillPurchase } from "../fulfillment/index.js";
import { publish, subscribe } from "../events/index.js";
import { syncDiscordRoles } from "../discord/index.js";
import { syncNotionPurchase } from "../notion/index.js";

subscribe("purchase.fulfilled", (record) => syncNotionPurchase(record));
subscribe("purchase.fulfilled", ({ email }) => syncDiscordRoles({ email }));

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

app.post("/webhook", bodyParser.raw({ type: "application/json" }), async (req, res) => {
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
    case "checkout.session.completed": {
      const session = event.data.object;
      const email = session.customer_details?.email || session.customer_email || "";
      const product = session.metadata?.product || "";
      const price = (session.amount_total || 0) / 100;
      const timestamp = new Date(session.created * 1000).toISOString();
      await fulfillPurchase({ email, product, price, timestamp });
      publish("purchase.completed", { email, product, price, timestamp });
      break;
    }
    default:
      break;
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("webhook_listening");
});
