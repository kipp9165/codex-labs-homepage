export function cacheKey(route, body) {
  const base = JSON.stringify({ route, body });
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return "cache_" + Math.abs(hash);
}
