export function generateTraceId(route, body) {
  const base = JSON.stringify({ route, body });
  let hash = 0;
  for (let i = 0; i < base.length; i++) {
    hash = (hash << 5) - hash + base.charCodeAt(i);
    hash |= 0;
  }
  return "trace_" + Math.abs(hash);
}
