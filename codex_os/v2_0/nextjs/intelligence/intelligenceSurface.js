export function intelligenceSurface(entity) {
  return {
    surface: Object.keys(entity || {}),
    message: "Intelligence surface mapped"
  };
}
