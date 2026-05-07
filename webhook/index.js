import express from "express";
import bodyParser from "body-parser";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const app = express();

// ---------------------------------------------------------------------------
// Baserow helper
// ---------------------------------------------------------------------------

async function writeBaserowRow(payload) {
  const baseUrl = process.env.BASEROW_API_URL;
  const token = process.env.BASEROW_TOKEN;

  if (!baseUrl || !token) {
    console.error(JSON.stringify({ event: "baserow_config_missing" }));
    return;
  }

  const url = baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`;

  let response;
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.error(
      JSON.stringify({ event: "baserow_fetch_error", error: String(err) })
    );
    return;
  }

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    console.error(
      JSON.stringify({
        event: "baserow_write_failed",
        status: response.status,
        body: text,
      })
    );
  }
}

// ---------------------------------------------------------------------------
// Event handlers
// ---------------------------------------------------------------------------

async function handleCheckoutSessionCompleted(session) {
  const email =
    session.customer_details?.email ?? session.customer_email ?? null;
  const product = session.metadata?.product ?? null;
  const amountTotal =
    typeof session.amount_total === "number"
      ? session.amount_total / 100
      : null;
  const timestamp = new Date(session.created * 1000).toISOString();

  console.log(
    JSON.stringify({
      event: "checkout.session.completed",
      session_id: session.id,
      email,
      product,
      amount_total: amountTotal,
      currency: session.currency ?? null,
      timestamp,
    })
  );

  await writeBaserowRow({
    session_id: session.id,
    email,
    product,
    amount_total: amountTotal,
    currency: session.currency ?? null,
    timestamp,
  });
}

// ---------------------------------------------------------------------------
// Webhook route
// ---------------------------------------------------------------------------

app.post("/webhook", bodyParser.raw({ type: "application/json" }), (req, res) => {
  const signature = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error(JSON.stringify({ event: "signature_verification_failed", error: String(err) }));
    return res.status(400).send("Invalid signature");
  }

  // Acknowledge immediately; process asynchronously.
  res.status(200).send("OK");

  switch (event.type) {
    case "checkout.session.completed":
      handleCheckoutSessionCompleted(event.data.object).catch((err) =>
        console.error(
          JSON.stringify({ event: "handler_error", type: event.type, error: String(err) })
        )
      );
      break;
    default:
      break;
  }
});

// ---------------------------------------------------------------------------
// Start server
// ---------------------------------------------------------------------------

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(JSON.stringify({ event: "webhook_listening", port }));
});
