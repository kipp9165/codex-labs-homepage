import { createHmac } from "crypto";

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

    const license = createHmac("sha256", secret)
      .update(`${email}:${product}:${timestamp}`)
      .digest("hex");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

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
        const body = await response.text().catch(() => "");
        throw new Error(
          `Baserow fulfillment write failed: ${response.status} ${response.statusText}${body ? ` - ${body}` : ""}`
        );
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
