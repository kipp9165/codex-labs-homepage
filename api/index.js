/**
 * Codex Labs — Public API + Static Server
 *
 * Serves /public as static files and exposes GET /api/products.
 * Run with: node api/index.js
 */

import express from 'express';
import { rateLimit } from 'express-rate-limit';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

const app = express();
app.use(express.json());

const apiLimiter = rateLimit({
  windowMs: 60_000,
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});

// ── Static: serve /public ────────────────────────────────────────────────────
app.use(express.static(join(ROOT, 'public')));

// ── GET /api/products ─────────────────────────────────────────────────────────
app.get('/api/products', apiLimiter, (_req, res) => {
  try {
    const raw = readFileSync(join(ROOT, 'config', 'commercial-surface.json'), 'utf8');
    const { products } = JSON.parse(raw);
    res.json(products);
  } catch (err) {
    console.error('[api/products] Failed to load products:', err);
    res.status(500).json({ error: 'Failed to load products.' });
  }
});

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Codex Labs public server running at http://localhost:${PORT}`);
});

export default app;
