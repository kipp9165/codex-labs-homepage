import { cacheKey } from "./cacheKey";
import { LRUCache } from "./lruCache";

const memoCache = new LRUCache(200);

export function memoize(route, body, fn) {
  const key = cacheKey(route, body);
  const cached = memoCache.get(key);
  if (cached) return cached;

  const result = fn();
  memoCache.set(key, result);
  return result;
}
