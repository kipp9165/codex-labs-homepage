import { memoize } from "./memoize";
import { precompute } from "./precompute";

export function performanceTest() {
  const heavyFn = () => {
    let sum = 0;
    for (let i = 0; i < 50000; i++) sum += i;
    return sum;
  };

  const memoResult = memoize("/test", { test: true }, heavyFn);
  const precomputed = precompute(() => "precomputed-ok");

  return {
    memoResult,
    precomputed
  };
}
