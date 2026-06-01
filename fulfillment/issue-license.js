import crypto from "crypto";

const DEFAULT_SALT = "codex-labs-license-v1";

function normalizePayload(input, options) {
  if (typeof input === "string") {
    return {
      customer_id: input,
      entitlement: options?.entitlement || "",
      product_id: options?.productId || "",
    };
  }

  return {
    customer_id: input?.customerId || "",
    entitlement: input?.entitlement || "",
    product_id: input?.productId || "",
  };
}

export function issueLicense(customer, options = {}) {
  const payload = normalizePayload(customer, options);
  const source = JSON.stringify(payload);
  const salt = process.env.LICENSE_SECRET || DEFAULT_SALT;

  return crypto.createHmac("sha256", salt).update(source).digest("hex").slice(0, 32);
}
