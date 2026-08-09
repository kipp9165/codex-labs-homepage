export function runtimeBoundary(entity) {
  return {
    boundary: Object.keys(entity || {}),
    message: "Runtime boundary mapped"
  };
}
