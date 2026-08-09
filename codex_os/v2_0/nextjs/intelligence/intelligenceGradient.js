export function intelligenceGradient(entity) {
  const gradient = entity?.complexity || 0;
  return {
    intelligence_gradient: gradient,
    message: "Intelligence gradient evaluated"
  };
}
