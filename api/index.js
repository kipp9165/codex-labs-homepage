import express from "express";
import fs from "node:fs";
import path from "node:path";
import Stripe from "stripe";

const app = express();
const port = Number(process.env.PORT || 3000);
const rootDir = process.cwd();
const publicDir = path.join(rootDir, "public");
const surfacePath = path.join(rootDir, "config", "commercial-surface.json");
const checkoutUrlsPath = path.join(rootDir, "config", "checkout-urls.json");
const fallbackActivationRitualUrl = "/daily-clarity-ritual.html";
const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret) : null;
const priceIdCache = new Map();
let cachedSurface = null;
let cachedSurfaceMtimeMs = 0;

app.set("trust proxy", 1);
app.use(express.json());
app.use(express.static(publicDir));

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, "utf8"));
  } catch (error) {
    throw new Error(`Failed to read JSON file: ${filePath}`, { cause: error });
  }
}

function loadProducts() {
  if (!fs.existsSync(surfacePath)) {
    throw new Error(`Missing product surface file: ${surfacePath}`);
  }

  const surfaceStat = fs.statSync(surfacePath);
  if (!cachedSurface || cachedSurfaceMtimeMs !== surfaceStat.mtimeMs) {
    cachedSurface = readJson(surfacePath);
    cachedSurfaceMtimeMs = surfaceStat.mtimeMs;
  }

  const surface = cachedSurface;
  return (surface.products || []).map((product) => ({
    id: product.id,
    name: product.name,
    description: product.description,
    family: product.family,
    label: product.label,
    activationRitualUrl: product.activationRitualUrl || fallbackActivationRitualUrl,
    prices: (product.prices || []).map((price) => ({
      lookup_key: price.lookup_key,
      amount: price.amount,
      currency: price.currency,
      tier: price.tier
    }))
  }));
}

function findProduct(productId) {
  return loadProducts().find((product) => product.id === productId);
}

function findPrice(product, lookupKey) {
  if (!product) return null;
  if (lookupKey) {
    return product.prices.find((price) => price.lookup_key === lookupKey) || null;
  }
  return product.prices[0] || null;
}

function getBaseUrl(req) {
  const forwardedProto = req.get("x-forwarded-proto");
  const protocol = forwardedProto === "http" || forwardedProto === "https" ? forwardedProto : req.protocol;
  return `${protocol}://${req.get("host")}`;
}

async function resolveStripePriceId(lookupKey) {
  if (!stripe) {
    return null;
  }

  if (priceIdCache.has(lookupKey)) {
    return priceIdCache.get(lookupKey);
  }

  const prices = await stripe.prices.list({
    lookup_keys: [lookupKey],
    active: true,
    limit: 1
  });

  if (!prices.data.length) {
    return null;
  }

  const id = prices.data[0].id;
  priceIdCache.set(lookupKey, id);
  return id;
}

app.get("/api/products", (req, res) => {
  try {
    res.json({ products: loadProducts() });
  } catch (error) {
    console.error("Failed to load products:", error);
    res.status(500).json({ error: "Unable to load products" });
  }
});

app.get("/api/products/:productId", (req, res) => {
  try {
    const product = findProduct(req.params.productId);
    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    res.json(product);
  } catch (error) {
    console.error("Failed to load product:", error);
    res.status(500).json({ error: "Unable to load product" });
  }
});

app.post("/api/checkout-session", async (req, res) => {
  try {
    const { productId, lookupKey } = req.body || {};
    const product = findProduct(productId);

    if (!product) {
      res.status(404).json({ error: "Product not found" });
      return;
    }

    const selectedPrice = findPrice(product, lookupKey);
    if (!selectedPrice?.lookup_key) {
      res.status(400).json({ error: "No valid price was selected" });
      return;
    }

    if (!stripe) {
      if (!fs.existsSync(checkoutUrlsPath)) {
        res.status(500).json({ error: "Checkout is temporarily unavailable. Please try again later." });
        return;
      }
      const checkoutUrls = readJson(checkoutUrlsPath);
      const fallbackUrl = checkoutUrls[selectedPrice.lookup_key];
      if (!fallbackUrl) {
        res.status(500).json({ error: "Checkout is temporarily unavailable. Please try again later." });
        return;
      }
      res.json({ url: fallbackUrl });
      return;
    }

    const priceId = await resolveStripePriceId(selectedPrice.lookup_key);
    if (!priceId) {
      res.status(404).json({ error: "Stripe price not found for selected tier" });
      return;
    }

    const baseUrl = getBaseUrl(req);
    const successUrl = `${baseUrl}/store/product.html?product=${encodeURIComponent(product.id)}&activated=1`;
    const cancelUrl = `${baseUrl}/store/product.html?product=${encodeURIComponent(product.id)}&cancelled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: successUrl,
      cancel_url: cancelUrl
    });

    res.json({ url: session.url });
  } catch (error) {
    console.error("Checkout session failed:", error);
    res.status(500).json({ error: "Unable to create checkout session" });
  }
});

app.listen(port, () => {
  console.log(`store_api_listening:${port}`);
});
