import { classifyDomain } from "../classifier.js";
import { evaluateAdmissibility } from "../admissibility.js";
import { getWhaleTierAccessState } from "../entitlements/checkWhaleTier.js";
import { advisoryMode } from "./advisory.js";
import { admissibilityAtT0 } from "./admissibility.js";
import { continuityFrame } from "./continuity.js";
import { overrideDomain } from "./domain.js";
import { driftFrame } from "./drift.js";

export async function constitutionalSubstrate({
  question = "",
  domain = "",
  tier = "standard",
  customerId = "",
  forceWhale = false,
  whaleTierStatus = null,
} = {}) {
  const classification = classifyDomain(question);
  const resolvedDomain = overrideDomain(domain, classification.domain);
  const entitlement = forceWhale
    ? {
        hasWhaleTier: true,
        customerId,
        matchedEntitlements: [],
        subscription: null,
        detail: "forced_whale_tier",
      }
    : whaleTierStatus || await getWhaleTierAccessState(customerId);
  const effectiveTier = entitlement.hasWhaleTier ? "whale" : "standard";
  const admissibility = evaluateAdmissibility({ question, domain: resolvedDomain, userTier: effectiveTier });
  const t0 = admissibilityAtT0(question, resolvedDomain, effectiveTier, admissibility);
  const drift = driftFrame(question, resolvedDomain, effectiveTier, { classifierConfidence: classification.confidence });
  const continuity = continuityFrame(question, resolvedDomain, effectiveTier);
  const advisory = advisoryMode(question, resolvedDomain, effectiveTier);
  const whaleGate = entitlement.hasWhaleTier
    ? null
    : {
        error: "stripe_access_denied",
        admissibility: "blocked",
        domain: "authority",
        drift: {
          identity_delta: 0,
          authority_delta: 0,
          admissibility_delta: -0.4,
        },
        message: "Whale Tier required",
      };

  return {
    classification,
    domain: resolvedDomain,
    effectiveTier,
    whaleTier: {
      whale: entitlement.hasWhaleTier,
      customerId: entitlement.customerId,
      detail: entitlement.detail,
    },
    entitlement,
    admissibility,
    admissibility_t0: t0,
    drift,
    continuity,
    advisory,
    whaleGate,
  };
}
