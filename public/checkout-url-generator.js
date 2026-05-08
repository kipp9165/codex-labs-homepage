import urls from "./config/checkout-urls.json" assert { type: "json" };

export function getCheckoutUrl(lookupKey) {
  if (!urls[lookupKey]) {
    throw new Error("Missing checkout URL for lookup key: " + lookupKey);
  }
  return urls[lookupKey];
}