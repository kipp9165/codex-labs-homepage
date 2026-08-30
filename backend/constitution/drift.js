const RESTRICTED_PATTERN = /api[_ -]?key|credential|password|secret|token|bypass|exploit|malware|weapon|harm|steal/i;

function round(value) {
  return Number(value.toFixed(2));
}

export function driftFrame(question, domain, tier, { classifierConfidence = 0.45 } = {}) {
  const normalizedQuestion = String(question).trim();
  const isRestricted = RESTRICTED_PATTERN.test(normalizedQuestion);
  const identityDelta = normalizedQuestion.length >= 12 ? 0 : -0.5;
  const authorityDelta = isRestricted ? -1 : domain === "authority" ? 0.25 : 0;
  const admissibilityDelta = !normalizedQuestion
    ? -1
    : isRestricted
      ? -0.8
      : normalizedQuestion.split(/\s+/).filter(Boolean).length >= 3
        ? 0.12
        : -0.1;

  return {
    identity_delta: round(identityDelta),
    authority_delta: round(authorityDelta),
    admissibility_delta: round(admissibilityDelta),
    tier_signal: tier === "whale" ? 1 : 0,
    classifier_confidence: round(classifierConfidence),
  };
}
