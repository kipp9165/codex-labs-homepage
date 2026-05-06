import crypto from "crypto";

export function issueLicense(customerId) {
  return crypto
    .createHash("sha256")
    .update(customerId + Date.now().toString())
    .digest("hex")
    .slice(0, 32);
}
