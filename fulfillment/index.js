import { createHmac } from "crypto";

const BASEROW_FETCH_TIMEOUT_MS = 10000;

export async function fulfillPurchase({ email, product, price, timestamp }) {
  try {
    const secret = process.env.FULFILLMENT_SECRET;
    const baserowUrl = process.env.BASEROW_FULFILLMENT_URL;
    const baserowApiKey = process.env.BASEROW_API_KEY;

    if (!secret) {
      throw new Error("FULFILLMENT_SECRET is not set");
    }
    if (!baserowUrl) {
      throw new Error("BASEROW_FULFILLMENT_URL is not set");
    }
    if (!baserowApiKey) {
      throw new Error("BASEROW_API_KEY is not set");
    }
    if (typeof email !== "string" || !email) {
      throw new Error("Invalid fulfillment input: email is required");
    }
    if (typeof product !== "string" || !product) {
      throw new Error("Invalid fulfillment input: product is required");
    }
    if (typeof timestamp !== "number" || !Number.isFinite(timestamp) || timestamp < 0) {
      throw new Error("Invalid fulfillment input: timestamp must be a finite non-negative number");
    }

    const license = createHmac("sha256", secret)
      .update(`${email}:${product}:${timestamp}`)
      .digest("hex");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), BASEROW_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(baserowUrl, {
        method: "POST",
        headers: {
          Authorization: `Token ${baserowApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          product,
          price,
          timestamp,
          license,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`Baserow fulfillment write failed: ${response.status} ${response.statusText}`);
      }
    } finally {
      clearTimeout(timeout);
    }

    console.log(JSON.stringify({ type: "fulfillment_success", email, product }));
    return { ok: true, license };
  } catch (err) {
    console.error("fulfillment_error", err);
    return { ok: false, error: err instanceof Error ? err.message : String(err) };
  }
}
