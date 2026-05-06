import Stripe from "stripe";
import fs from "fs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const surface = JSON.parse(fs.readFileSync("./config/commercial-surface.json", "utf8"));

async function ensureProduct(product) {
  const existing = await stripe.products.list({ limit: 100, active: true });
  let found = existing.data.find(p => p.metadata?.codex_id === product.id);

  if (!found) {
    found = await stripe.products.create({
      name: product.name,
      description: product.description,
      metadata: {
        codex_id: product.id,
        family: product.family,
        label: product.label
      }
    });
    console.log(`Created product: ${product.id}`);
  } else {
    console.log(`Product exists: ${product.id}`);
  }

  return found.id;
}

async function ensurePrice(productId, price) {
  const existing = await stripe.prices.list({
    lookup_keys: [price.lookup_key],
    limit: 1
  });

  if (existing.data.length > 0) {
    console.log(`Price exists: ${price.lookup_key}`);
    return existing.data[0].id;
  }

  const created = await stripe.prices.create({
    unit_amount: price.amount,
    currency: price.currency,
    product: productId,
    lookup_key: price.lookup_key,
    metadata: {
      tier: price.tier
    }
  });

  console.log(`Created price: ${price.lookup_key}`);
  return created.id;
}

async function main() {
  for (const product of surface.products) {
    const productId = await ensureProduct(product);

    for (const price of product.prices) {
      await ensurePrice(productId, price);
    }
  }

  console.log("Codex Labs Stripe import complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
