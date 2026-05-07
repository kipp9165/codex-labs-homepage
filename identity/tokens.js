import crypto from "crypto";

const TOKEN_TTL_MS = 15 * 60 * 1000;

function sign(value) {
  return crypto.createHmac("sha256", process.env.IDENTITY_SECRET || "").update(value).digest("hex");
}

export function generateLoginToken(email) {
  const timestamp = Date.now().toString();
  const payload = `${email}.${timestamp}`;
  const signature = sign(payload);
  return Buffer.from(`${email}.${timestamp}.${signature}`, "utf8").toString("base64url");
}

export function verifyLoginToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const parts = decoded.split(".");
    if (parts.length < 3) {
      return null;
    }

    const signature = parts[parts.length - 1];
    const timestampPart = parts[parts.length - 2];
    const email = parts.slice(0, -2).join(".");
    const timestamp = Number(timestampPart);

    if (!email || Number.isNaN(timestamp)) {
      return null;
    }

    if (Date.now() - timestamp > TOKEN_TTL_MS) {
      return null;
    }

    const payload = `${email}.${timestampPart}`;
    const expectedSignature = sign(payload);
    const providedBuffer = Buffer.from(signature, "hex");
    const expectedBuffer = Buffer.from(expectedSignature, "hex");

    if (providedBuffer.length !== expectedBuffer.length) {
      return null;
    }

    if (!crypto.timingSafeEqual(providedBuffer, expectedBuffer)) {
      return null;
    }

    return email;
  } catch {
    return null;
  }
}
