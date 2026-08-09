const rateMap = new Map();
const LIMIT = 60;
const WINDOW = 60000;

export function rateLimit(req, res, next) {
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
  const now = Date.now();

  if (!rateMap.has(ip)) {
    rateMap.set(ip, []);
  }

  const timestamps = rateMap.get(ip).filter(t => now - t < WINDOW);
  timestamps.push(now);
  rateMap.set(ip, timestamps);

  if (timestamps.length > LIMIT) {
    return res.status(429).json({ error: "Rate limit exceeded" });
  }

  next();
}
