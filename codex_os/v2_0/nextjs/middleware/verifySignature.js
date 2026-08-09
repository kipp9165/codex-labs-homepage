import crypto from "crypto";

export function verifySignature(req, res, next) {
  const signature = req.headers["x-codex-signature"];
  const body = JSON.stringify(req.body || {});
  const secret = process.env.CODEX_SECRET || "codex_default_secret";

  const expected = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  if (signature !== expected) {
    return res.status(401).json({ error: "Invalid signature" });
  }

  next();
}
