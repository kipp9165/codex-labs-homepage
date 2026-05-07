import express from "express";
import bodyParser from "body-parser";
import { getUserEntitlements } from "../access/index.js";
import { verifyLicense } from "../license/index.js";
import { getCustomerPortalState } from "../portal/index.js";
import { listProducts } from "../product-brain/index.js";

const app = express();
app.use(express.json());
app.use(bodyParser.json());
const licenseVerifyWindowMs = 60_000;
const licenseVerifyMaxRequestsPerWindow = 30;
const licenseVerifyHits = new Map();

function cleanupLicenseVerifyHits(now) {
  for (const [key, value] of licenseVerifyHits.entries()) {
    if (now - value.windowStart >= licenseVerifyWindowMs) {
      licenseVerifyHits.delete(key);
    }
  }
}

function licenseVerifyRateLimiter(req, res, next) {
  const ip = req.ip || req.socket?.remoteAddress || "unknown";
  const now = Date.now();
  cleanupLicenseVerifyHits(now);

  const current = licenseVerifyHits.get(ip);
  if (!current || now - current.windowStart >= licenseVerifyWindowMs) {
    licenseVerifyHits.set(ip, { count: 1, windowStart: now });
    return next();
  }
  if (current.count >= licenseVerifyMaxRequestsPerWindow) {
    return res.status(429).json({ ok: false, error: "rate_limited" });
  }

  current.count += 1;
  licenseVerifyHits.set(ip, current);
  next();
}

app.get("/api/status", async (req, res) => {
  try {
    res.json({
      ok: true,
      service: "codex-labs-os",
      time: new Date().toISOString()
    });
  } catch (err) {
    console.error("api_error", err);
    res.status(500).json({ ok: false, error: "internal_error" });
  }
});

app.get("/api/products", async (req, res) => {
  try {
    const products = await listProducts();
    res.json({ ok: true, products });
  } catch (err) {
    console.error("api_error", err);
    res.status(500).json({ ok: false, error: "internal_error" });
  }
});

app.get("/api/entitlements", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ ok: false, error: "email_required" });
    }

    const result = await getUserEntitlements(email);
    res.json(result);
  } catch (err) {
    console.error("api_error", err);
    res.status(500).json({ ok: false, error: "internal_error" });
  }
});

app.post("/api/license/verify", licenseVerifyRateLimiter, async (req, res) => {
  try {
    const { email, product, license } = req.body || {};
    if (!email || !product || !license) {
      return res.status(400).json({ ok: false, error: "invalid_request" });
    }

    const result = await verifyLicense({ email, product, license });
    res.json(result);
  } catch (err) {
    console.error("api_error", err);
    res.status(500).json({ ok: false, error: "internal_error" });
  }
});

app.get("/api/portal", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ ok: false, error: "email_required" });
    }

    const result = await getCustomerPortalState(email);
    res.json(result);
  } catch (err) {
    console.error("api_error", err);
    res.status(500).json({ ok: false, error: "internal_error" });
  }
});

const port = process.env.API_PORT || 4000;

app.listen(port, () => console.log("api_gateway_listening", { port }));
