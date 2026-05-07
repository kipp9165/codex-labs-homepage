import products from "./products.json" assert { type: "json" };

const catalog = Object.freeze(
  products.map((product) =>
    Object.freeze({
      ...product,
      entitlements: Object.freeze([...product.entitlements])
    })
  )
);

const productsById = new Map(catalog.map((product) => [product.id, product]));
const productsByLookupKey = new Map(
  catalog.map((product) => [product.stripe_price_lookup_key, product])
);
const emptyEntitlements = Object.freeze([]);

export function getProductById(id) {
  return productsById.get(id) ?? null;
}

export function getProductByLookupKey(lookupKey) {
  return productsByLookupKey.get(lookupKey) ?? null;
}

export function listProducts() {
  return catalog;
}

export function getEntitlementsForProductId(id) {
  return productsById.get(id)?.entitlements ?? emptyEntitlements;
}
