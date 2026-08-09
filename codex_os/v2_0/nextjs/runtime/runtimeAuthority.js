export function runtimeAuthority(entity) {
  const authority = entity?.authority || 0;
  return {
    runtime_authority: authority,
    message: "Runtime authority evaluated"
  };
}
