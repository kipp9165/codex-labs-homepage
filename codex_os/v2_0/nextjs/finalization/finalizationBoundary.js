export function finalizationBoundary(entity) {
  return {
    boundary: Object.keys(entity || {}),
    message: "Finalization boundary mapped"
  };
}
