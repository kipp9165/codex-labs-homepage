export function executionAuthority(entity) {
  const authority = entity?.authority || 0;
  return {
    execution_authority: authority,
    message: "Execution authority evaluated"
  };
}
