export function redundancy(route, body) {
  return {
    redundant: true,
    route,
    body,
    message: "Redundant path executed"
  };
}
