import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

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
      break;
    default:
      break;
  }
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("webhook_listening");
});
