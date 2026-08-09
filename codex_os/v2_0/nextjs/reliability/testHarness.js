import { retry } from "./retry";
import { circuitBreaker } from "./circuitBreaker";
import { fallbackResponse } from "./fallback";

export async function reliabilityTest() {
  const failingFn = async () => {
    throw new Error("Simulated failure");
  };

  const retryResult = await retry(() => Promise.resolve("retry-ok"));
  const circuitResult = await circuitBreaker(failingFn);
  const fallback = fallbackResponse("/test", { test: true });

  return {
    retryResult,
    circuitResult,
    fallback
  };
}
