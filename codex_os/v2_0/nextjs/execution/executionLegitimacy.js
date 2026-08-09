export function executionLegitimacy(entity) {
  const legitimacy = Object.keys(entity || {}).length * 25;
  return {
    execution_legitimacy: legitimacy,
    message: "Execution legitimacy calculated"
  };
}
