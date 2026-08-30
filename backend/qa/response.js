export function buildQaResponse({ question, domain, admissibility, tier, advisory, continuity }) {
  const baseLines = [
    "Decision Frame",
    `- Domain: ${domain}`,
    `- Admissibility: ${admissibility.admissibility}`,
    "",
    "Constitutional Reading",
    question,
    "",
  ];

  if (tier === "whale") {
    return [
      ...baseLines,
      "Whale Layer",
      "- Whale Priority: active",
      `- Continuity Pulse: ${continuity.continuity_pulse}`,
      "",
      "Architectural Comparison",
      `Primary thread: ${question}`,
      `Comparison: assess ${domain} impacts against authority, continuity, and interoperability before execution.`,
      "",
      "Advisory Layer",
      ...(advisory?.frame || ["Whale advisory frame unavailable."]),
    ].join("\n");
  }

  return [
    ...baseLines,
    "Operating Guidance",
    admissibility.admissibility === "allowed"
      ? `Proceed within the ${domain} lane while preserving identity, authority, continuity, and execution traceability.`
      : `Request blocked due to ${admissibility.reason}. Reframe the question with clearer context and permissible scope.`,
  ].join("\n");
}

export function buildBlockedResponse(message) {
  return `Access blocked: ${message}.`;
}
