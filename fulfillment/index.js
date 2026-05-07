import crypto from "crypto";
import { sendEmail } from "./send-email.js";
import { publish } from "../events/index.js";

function issueLicense(email, product) {
  return crypto
    .createHmac("sha256", process.env.FULFILLMENT_SECRET)
    .update(`${email}:${product}`)
    .digest("hex");
}

export async function fulfillPurchase({ email, product, price, timestamp }) {
  try {
    const license = issueLicense(email, product);
    await sendEmail({
      to: email,
      subject: `Your ${product} license`,
      body: `License key: ${license}`,
    });
    const record = { email, product, price, timestamp, license };
    publish("purchase.fulfilled", record);
    return { ok: true, license };
  } catch (e) {
    console.error("fulfillment_error", e.message);
    return { ok: false, error: e.message };
  }
}
