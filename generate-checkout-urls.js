import Stripe from "stripe";
import fs from "fs";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

const surface = JSON.parse(fs.readFileSync("./config/commercial-surface.json", "utf8"));
const urls = JSON.parse(fs.readFileSync("./config/checkout-urls.json", "utf8"));

async function ensureCheckoutUrl(lookupKey, priceId) {
  if (urls[lookupKey]) {
    console.log(`URL exists: ${lookupKey}`);
    return urls[lookupKey];
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: "https://kipp9165.github.io/codex-labs-homepage/success.html",
    cancel_url: "https://kipp9165.github.io/codex-labs-homepage/cancel.html"
  });

  urls[lookupKey] = session.url;
  console.log(`Created URL: ${lookupKey}`);
  return session.url;
}

async function main() {
  for (const product of surface.products) {
    for (const price of product.prices) {
      const priceList = await stripe.prices.list({
        lookup_keys: [price.lookup_key],
        limit: 1
      });

      if (priceList.data.length === 0) {
        throw new Error("Missing Stripe price for lookup key: " + price.lookup_key);
      }

      const priceId = priceList.data[0].id;
      await ensureCheckoutUrl(price.lookup_key, priceId);
    }
  }

  fs.writeFileSync(
    "./config/checkout-urls.json",
    JSON.stringify(urls, null, 2),
    "utf8"
  );

  console.log("Checkout URL population complete.");
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
