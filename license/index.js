import crypto from "crypto";

export function verifyLicense({ email, product, license }) {
  const expected = crypto
    .createHmac("sha256", process.env.FULFILLMENT_SECRET)
    .update(`${email}:${product}`)
    .digest("hex");
  return { valid: expected === license };
}
