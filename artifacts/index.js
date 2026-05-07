import { createHmac } from "crypto";
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import { join, dirname } from "path";

if (!process.env.ARTIFACT_SECRET) {
  throw new Error("ARTIFACT_SECRET environment variable is required");
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const registry = JSON.parse(readFileSync(join(__dirname, "registry.json"), "utf8"));

export function getArtifactsForEntitlements(entitlements) {
  return registry.filter(a =>
    a.entitlementsRequired.every(e => entitlements.includes(e))
  );
}

export function generateDownloadToken(artifactId, email) {
  const expires = Math.floor(Date.now() / 1000) + 900;
  const payload = `${artifactId}:${email}:${expires}`;
  const sig = createHmac("sha256", process.env.ARTIFACT_SECRET)
    .update(payload)
    .digest("hex");
  return Buffer.from(`${payload}:${sig}`).toString("base64url");
}

export function verifyDownloadToken(token) {
  try {
    const decoded = Buffer.from(token, "base64url").toString("utf8");
    const lastColon = decoded.lastIndexOf(":");
    const payload = decoded.slice(0, lastColon);
    const sig = decoded.slice(lastColon + 1);
    const expected = createHmac("sha256", process.env.ARTIFACT_SECRET)
      .update(payload)
      .digest("hex");
    if (sig !== expected) return { ok: false, error: "invalid_signature" };
    const parts = payload.split(":");
    const expires = parseInt(parts[parts.length - 1], 10);
    if (Math.floor(Date.now() / 1000) > expires) return { ok: false, error: "token_expired" };
    const email = parts[parts.length - 2];
    const artifactId = parts.slice(0, parts.length - 2).join(":");
    return { ok: true, artifactId, email };
  } catch {
    return { ok: false, error: "invalid_token" };
  }
}
