import express from "express";
import { completeLogin, getSession, requestLogin } from "../identity/index.js";

const app = express();
app.use(express.json());
const authAttempts = new Map();

function isRateLimited(scope, ip, limit, windowMs) {
  const now = Date.now();
  const key = `${scope}:${ip || "unknown"}`;
  const existing = authAttempts.get(key);
  const state = !existing || now > existing.resetAt ? { count: 0, resetAt: now + windowMs } : existing;
  state.count += 1;
  authAttempts.set(key, state);
  return state.count > limit;
}

app.post("/api/auth/request", async (req, res) => {
  if (isRateLimited("request", req.ip, 10, 15 * 60 * 1000)) {
    return res.status(429).json({ ok: false });
  }
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!email) {
    return res.status(400).json({ ok: false });
  }

  const result = await requestLogin(email);
  return res.json(result);
});

app.post("/api/auth/complete", async (req, res) => {
  if (isRateLimited("complete", req.ip, 20, 15 * 60 * 1000)) {
    return res.status(429).json({ ok: false });
  }
  const token = typeof req.body?.token === "string" ? req.body.token : "";
  if (!token) {
    return res.status(400).json({ ok: false });
  }

  const result = await completeLogin(token);
  if (!result.ok) {
    return res.status(401).json(result);
  }

  return res.json(result);
});

app.get("/api/auth/session", (req, res) => {
  const sessionId = typeof req.query.sessionId === "string" ? req.query.sessionId : "";
  const result = getSession(sessionId);
  if (!result.ok) {
    return res.status(401).json(result);
  }

  return res.json(result);
});

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`identity_listening:${port}`);
});
