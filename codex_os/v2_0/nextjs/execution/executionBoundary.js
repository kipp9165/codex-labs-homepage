export function executionBoundary(entity) {
  return {
    boundary: Object.keys(entity || {}),
    message: "Execution boundary mapped"
  };
}
