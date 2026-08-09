let failureCount = 0;
const FAILURE_THRESHOLD = 3;
let circuitOpen = false;

export async function circuitBreaker(fn) {
  if (circuitOpen) {
    return { circuit: "open", fallback: true };
  }

  try {
    const result = await fn();
    failureCount = 0;
    return { circuit: "closed", result };
  } catch (err) {
    failureCount++;
    if (failureCount >= FAILURE_THRESHOLD) {
      circuitOpen = true;
    }
    return { circuit: "closed", error: err };
  }
}
