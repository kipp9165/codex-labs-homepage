export function intelligenceReceipt(engine, surface, gradient, coherence, drift) {
  return {
    intelligence_receipt: true,
    engine,
    surface,
    gradient,
    coherence,
    drift,
    version: "v2.0"
  };
}
