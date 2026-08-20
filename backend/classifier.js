export const VALID_DOMAINS = [
  "authority",
  "admissibility",
  "continuity",
  "consequence",
  "interoperability",
];

const DOMAIN_KEYWORDS = {
  authority: ["authority", "approve", "decision", "owner", "permission", "governance", "policy", "mandate", "who decides"],
  admissibility: ["admissible", "allowed", "block", "deny", "eligibility", "qualify", "can i", "should i"],
  continuity: ["continue", "continuity", "persist", "history", "handoff", "timeline", "state", "retain"],
  consequence: ["impact", "risk", "consequence", "outcome", "tradeoff", "damage", "cost", "benefit"],
  interoperability: ["integrate", "interoperability", "system", "api", "connect", "compatib", "interface", "sync"],
};

function countMatches(question, keywords) {
  return keywords.reduce((score, keyword) => {
    if (keyword.includes(" ")) {
      return score + (question.includes(keyword) ? 2 : 0);
    }

    return score + (question.includes(keyword) ? 1 : 0);
  }, 0);
}

export function classifyDomain(question = "") {
  const normalizedQuestion = String(question).toLowerCase();
  const scores = Object.entries(DOMAIN_KEYWORDS).map(([domain, keywords]) => ({
    domain,
    score: countMatches(normalizedQuestion, keywords),
  }));

  scores.sort((left, right) => right.score - left.score);

  const top = scores[0] || { domain: "admissibility", score: 0 };
  const runnerUp = scores[1] || { score: 0 };
  const confidenceBase = top.score === 0 ? 0.45 : 0.6 + Math.min(top.score, 4) * 0.08;
  const confidenceSpread = top.score === runnerUp.score ? -0.12 : 0;
  const confidence = Math.max(0.45, Math.min(0.98, confidenceBase + confidenceSpread));

  return {
    domain: VALID_DOMAINS.includes(top.domain) ? top.domain : "admissibility",
    confidence: Number(confidence.toFixed(2)),
    scores,
  };
}
