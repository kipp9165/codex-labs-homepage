import express from "express";
import { completeLogin, getSession, requestLogin } from "../identity/index.js";

const app = express();
app.use(express.json());

app.post("/api/auth/request", async (req, res) => {
  const email = typeof req.body?.email === "string" ? req.body.email.trim() : "";
  if (!email) {
    return res.status(400).json({ ok: false });
  }

  const result = await requestLogin(email);
  return res.json(result);
});

app.post("/api/auth/complete", async (req, res) => {
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
