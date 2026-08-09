export function legitimacyHorizon(entity) {
  const horizon = Object.keys(entity || {}).length * 12;
  return {
    legitimacy_horizon: horizon,
    message: "Legitimacy horizon calculated"
  };
}
