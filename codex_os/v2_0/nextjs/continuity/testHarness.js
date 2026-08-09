import { continuityDelta } from "./continuityDelta";
import { detectDrift } from "./driftDetector";
import { validateState } from "./stateValidator";
import { recordContinuity, getContinuityLedger } from "./continuityLedger";
import { continuityReceipt } from "./continuityReceipt";

export function continuityTest() {
  const prev = { a: 1, b: 2, c: 3 };
  const next = { a: 1, b: 5, c: 3 };

  const delta = continuityDelta(prev, next);
  const drift = detectDrift(prev, next);
  const validation = validateState(next);

  const receipt = continuityReceipt(delta, drift);

  recordContinuity(receipt);

  return {
    delta,
    drift,
    validation,
    receipt,
    ledger: getContinuityLedger()
  };
}
