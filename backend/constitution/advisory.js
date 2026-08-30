function summarizeQuestion(question) {
  const normalized = String(question).trim();
  if (!normalized) {
    return "No question supplied.";
  }

  return normalized.length > 160 ? `${normalized.slice(0, 157)}...` : normalized;
}

export function advisoryMode(question, domain, tier) {
  if (tier !== "whale") {
    return null;
  }

  return {
    mode: "deep",
    domain,
    tier,
    packet: "whale_advisory",
    question_focus: summarizeQuestion(question),
    frame: [
      "Founder-adjacent review remains available for governance-grade decisions.",
      "Preserve continuity receipts, drift evidence, and execution lineage before acting.",
      `Advance through the ${domain} lane with architecture-first tradeoff review.`,
    ],
  };
}
