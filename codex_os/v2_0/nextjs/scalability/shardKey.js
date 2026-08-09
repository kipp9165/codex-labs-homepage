export function shardKey(route, body) {
  const base = JSON.stringify({ route, body });
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return "shard_" + Math.abs(hash % 8); // 8-way deterministic shard
}
