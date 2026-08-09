export function constitutionalSurface(entity) {
  return {
    surface: Object.keys(entity || {}),
    message: "Constitutional surface mapped"
  };
}
