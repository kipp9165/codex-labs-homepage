export function fallbackResponse(route, body) {
  return {
    fallback: true,
    route,
    body,
    message: "Deterministic fallback activated"
  };
}
