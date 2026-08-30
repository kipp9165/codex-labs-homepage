import { evaluateAdmissibility } from "../admissibility.js";

const MISSION_CRITICAL_PATTERN = /outage|incident|production|customer data|breach|legal|payment|payroll|deploy|emergency|security/i;

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

export function admissibilityAtT0(question, domain, tier) {
  const admissibility = evaluateAdmissibility({ question, domain, userTier: tier });
  const missionCriticalBoundary = MISSION_CRITICAL_PATTERN.test(String(question)) || ["authority", "continuity"].includes(domain);
  const baseScore = admissibility.admissibility === "allowed" ? 0.74 : 0.22;
  const score = clamp(
    baseScore
      + (tier === "whale" ? 0.12 : 0)
      + (missionCriticalBoundary && admissibility.admissibility === "allowed" ? 0.08 : 0),
    0,
    0.98,
  );

  return {
    admissibility_score: Number(score.toFixed(2)),
    boundary_classification: admissibility.admissibility === "blocked"
      ? "blocked"
      : missionCriticalBoundary
        ? "mission_critical"
        : "standard",
    mission_critical_boundary: missionCriticalBoundary,
  };
}
