const cache = new Map();

export function distributedGet(key) {
  return cache.get(key) || null;
}

export function distributedSet(key, value) {
  cache.set(key, value);
}
