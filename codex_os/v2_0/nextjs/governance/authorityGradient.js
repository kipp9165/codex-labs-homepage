export function authorityGradient(entity) {
  const gradient = entity?.level || 0;
  return {
    authority_gradient: gradient,
    message: "Authority gradient evaluated"
  };
}
