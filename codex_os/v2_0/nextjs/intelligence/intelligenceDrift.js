export function intelligenceDrift(prevState, nextState) {
  const drift = [];
  for (const key of Object.keys(nextState)) {
    if (prevState[key] !== nextState[key]) {
      drift.push(key);
    }
  }
  return drift;
}
