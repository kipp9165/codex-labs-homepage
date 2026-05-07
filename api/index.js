import express from "express";
import { getSession } from "../identity/index.js";
import { getUserEntitlements } from "../access/index.js";
import {
  getArtifactsForEntitlements,
  generateDownloadToken,
  verifyDownloadToken,
} from "../artifacts/index.js";
import artifactsRegistry from "../artifacts/registry.json" assert { type: "json" };

const app = express();
app.use(express.json());

app.get("/api/artifacts", async (req, res) => {
  try {
    const { sessionId } = req.query;
    if (!sessionId) return res.status(401).json({ ok: false, error: "unauthenticated" });
    const session = await getSession(sessionId);
    if (!session || !session.ok) return res.status(401).json({ ok: false, error: "invalid_session" });
    const { email } = session;
    const entitlementsResult = await getUserEntitlements(email);
    if (!entitlementsResult || !entitlementsResult.ok) {
      return res.status(500).json({ ok: false, error: "entitlement_error" });
    }
    const artifacts = getArtifactsForEntitlements(entitlementsResult.entitlements);
    return res.json({ ok: true, artifacts });
  } catch (err) {
    console.error("artifact_api_error", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

app.post("/api/artifacts/download-token", async (req, res) => {
  try {
    const { sessionId, artifactId } = req.body;
    if (!sessionId || !artifactId) {
      return res.status(400).json({ ok: false, error: "missing_fields" });
    }
    const session = await getSession(sessionId);
    if (!session || !session.ok) return res.status(401).json({ ok: false, error: "invalid_session" });
    const { email } = session;
    const entitlementsResult = await getUserEntitlements(email);
    if (!entitlementsResult || !entitlementsResult.ok) {
      return res.status(500).json({ ok: false, error: "entitlement_error" });
    }
    const allowed = getArtifactsForEntitlements(entitlementsResult.entitlements);
    if (!allowed.some(a => a.id === artifactId)) {
      return res.status(403).json({ ok: false, error: "not_entitled" });
    }
    const token = generateDownloadToken(artifactId, email);
    return res.json({ ok: true, token });
  } catch (err) {
    console.error("artifact_api_error", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

app.get("/api/artifacts/download", (req, res) => {
  try {
    const { token } = req.query;
    if (!token) return res.status(400).json({ ok: false, error: "token_required" });
    const result = verifyDownloadToken(token);
    if (!result.ok) return res.status(403).json({ ok: false, error: "invalid_token" });
    const artifact = artifactsRegistry.find(a => a.id === result.artifactId);
    if (!artifact) return res.status(404).json({ ok: false, error: "artifact_not_found" });
    return res.redirect(302, artifact.fileUrl);
  } catch (err) {
    console.error("artifact_api_error", err);
    return res.status(500).json({ ok: false, error: "internal_error" });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log("api_listening");
});
