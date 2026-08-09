export function runtimeLegitimacy(entity) {
  const legitimacy = Object.keys(entity || {}).length * 20;
  return {
    runtime_legitimacy: legitimacy,
    message: "Runtime legitimacy calculated"
  };
}
