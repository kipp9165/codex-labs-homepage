export function degrade(route, body) {
  return {
    degraded: true,
    route,
    body,
    mode: "deterministic-degradation",
    message: "System degraded gracefully"
  };
}
