export function validateState(state) {
  const valid = typeof state === "object" && state !== null;
  return {
    valid,
    message: valid ? "State integrity validated" : "Invalid state"
  };
}
