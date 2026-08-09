export function legitimacyScore(entity) {
  const score = Object.keys(entity || {}).length * 10;
  return {
    legitimacy_score: score,
    message: "Legitimacy score calculated"
  };
}
