export function finalizationLegitimacy(entity) {
  const legitimacy = Object.keys(entity || {}).length * 30;
  return {
    finalization_legitimacy: legitimacy,
    message: "Finalization legitimacy calculated"
  };
}
