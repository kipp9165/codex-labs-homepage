const seen = new Set();

export function replayGuard(req, res, next) {
  const nonce = req.headers["x-codex-nonce"];
  if (!nonce) return res.status(400).json({ error: "Missing nonce" });

  if (seen.has(nonce)) {
    return res.status(409).json({ error: "Replay detected" });
  }

  seen.add(nonce);
  next();
}
