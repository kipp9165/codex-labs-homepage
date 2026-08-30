import { VALID_DOMAINS } from "./classifier.js";

const BLOCKED_PATTERNS = [
  /api[_ -]?key/i,
  /credential/i,
  /password/i,
  /secret/i,
  /token/i,
  /bypass/i,
  /exploit/i,
  /malware/i,
  /weapon/i,
  /harm/i,
  /steal/i,
];

function scoreToDelta(score) {
  return Number((score - 1).toFixed(2));
}

export function evaluateAdmissibility({ question = "", domain = "admissibility", userTier = "standard" } = {}) {
  const normalizedQuestion = String(question).trim();
  const blockedPattern = BLOCKED_PATTERNS.find((pattern) => pattern.test(normalizedQuestion));
  const wordCount = normalizedQuestion.split(/\s+/).filter(Boolean).length;
  const validDomain = VALID_DOMAINS.includes(domain);

  const identityScore = normalizedQuestion.length >= 12 ? 1 : 0.5;
  const authorityScore = blockedPattern ? 0 : 1;
  const domainScore = validDomain ? 1 : 0;
  const surfaceScore = normalizedQuestion.length > 0 && normalizedQuestion.length <= 4000 ? 1 : 0;
  const contextScore = wordCount >= 3 ? 1 : 0.5;

  const blocked = !normalizedQuestion || !!blockedPattern || !validDomain || surfaceScore === 0;
  const identityDelta = scoreToDelta(identityScore);
  const authorityDelta = scoreToDelta(authorityScore);
  const admissibilityDelta = Number((((identityScore + authorityScore + domainScore + surfaceScore + contextScore) / 5) - 1).toFixed(2));

  // eslint-disable-next-line no-console
  console.log(
    "[DEBUG admissibility]",
    "question:", normalizedQuestion.slice(0, 120),
    "domain:", domain,
    "admissibility_delta:", admissibilityDelta,
    "identity_delta:", identityDelta,
    "authority_delta:", authorityDelta,
    "blocked:", blocked,
  );

  return {
    admissibility: blocked ? "blocked" : "allowed",
    reason: !normalizedQuestion
      ? "empty_question"
      : blockedPattern
        ? "restricted_request"
        : !validDomain
          ? "invalid_domain"
          : surfaceScore === 0
            ? "surface_violation"
            : "allowed",
    checks: {
      identity: identityScore === 1 ? "confirmed" : "partial",
      authority: authorityScore === 1 ? "confirmed" : "blocked",
      domain: validDomain ? "confirmed" : "blocked",
      surface: surfaceScore === 1 ? "confirmed" : "blocked",
      context: contextScore === 1 ? "confirmed" : "partial",
    },
    drift: {
      identity_delta: identityDelta,
      authority_delta: authorityDelta,
      admissibility_delta: admissibilityDelta,
      tier_signal: userTier === "whale" ? 1 : 0,
    },
  };
}
