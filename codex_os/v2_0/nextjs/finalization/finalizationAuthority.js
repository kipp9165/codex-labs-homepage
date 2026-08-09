export function finalizationAuthority(entity) {
  const authority = entity?.authority || 0;
  return {
    finalization_authority: authority,
    message: "Finalization authority evaluated"
  };
}
