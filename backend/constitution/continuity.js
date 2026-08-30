const CONTINUITY_PATTERN = /continuity|history|handoff|retain|timeline|state|receipt|thread|prior/i;

export function continuityFrame(question, domain, tier) {
  const continuitySignal = tier === "whale"
    ? 1
    : domain === "continuity" || CONTINUITY_PATTERN.test(String(question))
      ? 0.82
      : 0.56;

  return {
    continuity_signal: Number(continuitySignal.toFixed(2)),
    continuity_pulse: continuitySignal >= 0.9 ? "elevated" : continuitySignal >= 0.7 ? "stable" : "baseline",
    substrate_alignment: continuitySignal >= 0.7 ? "aligned" : "monitoring",
  };
}
