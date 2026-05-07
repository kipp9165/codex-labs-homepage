import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

async function handleCheckoutSessionCompleted(session) {
  const email = session.customer_details?.email ?? session.customer_email ?? null;
  const product = session.metadata?.product ?? null;
  const price = (session.amount_total ?? 0) / 100;
  const timestamp = new Date(session.created * 1000).toISOString();

  console.log(JSON.stringify({ event: "checkout.session.completed", email, product, price, timestamp }));

  await fetch(`${process.env.BASEROW_API_URL}`, {
    method: "POST",
    headers: {
      Authorization: `Token ${process.env.BASEROW_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, product, price, timestamp }),
  });
}

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

  (async () => {
    try {
      if (event.type === "checkout.session.completed") {
        await handleCheckoutSessionCompleted(event.data.object);
      }
    } catch (err) {
      console.error(JSON.stringify({ event: "webhook_processing_error", type: event.type, error: err.message }));
    }
  })();
});

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log("webhook_listening");
});
