export function continuityDelta(prevState, nextState) {
  const delta = {};
  for (const key of Object.keys(nextState)) {
    if (prevState[key] !== nextState[key]) {
      delta[key] = { before: prevState[key], after: nextState[key] };
    }
  }
  return delta;
}
