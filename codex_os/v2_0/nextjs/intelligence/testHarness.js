import { intelligenceEngine } from "./intelligenceEngine";
import { intelligenceSurface } from "./intelligenceSurface";
import { intelligenceGradient } from "./intelligenceGradient";
import { intelligenceCoherence } from "./intelligenceCoherence";
import { intelligenceDrift } from "./intelligenceDrift";
import { recordIntelligence, getIntelligenceLedger } from "./intelligenceLedger";
import { intelligenceReceipt } from "./intelligenceReceipt";

export function intelligenceTest() {
  const prev = { a: 1, b: 2, c: 3 };
  const next = { a: 1, b: 7, c: 3 };

  const entity = { complexity: 5, domain: "intelligence", scope: "system" };

  const engine = intelligenceEngine(entity);
  const surface = intelligenceSurface(entity);
  const gradient = intelligenceGradient(entity);
  const coherence = intelligenceCoherence(entity);
  const drift = intelligenceDrift(prev, next);

  const receipt = intelligenceReceipt(engine, surface, gradient, coherence, drift);

  recordIntelligence(receipt);

  return {
    engine,
    surface,
    gradient,
    coherence,
    drift,
    receipt,
    ledger: getIntelligenceLedger()
  };
}
