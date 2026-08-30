import { classifyDomain } from "../classifier.js";
import { evaluateAdmissibility } from "../admissibility.js";
import { verifyWhaleTier } from "../services/stripe.js";
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
} = {}) {
  const classification = classifyDomain(question);
  const resolvedDomain = overrideDomain(domain, classification.domain);
  const whaleTier = forceWhale ? { whale: true, customerId } : await verifyWhaleTier(customerId);
  const effectiveTier = whaleTier.whale ? "whale" : tier;
  const admissibility = evaluateAdmissibility({ question, domain: resolvedDomain, userTier: effectiveTier });
  const t0 = admissibilityAtT0(question, resolvedDomain, effectiveTier);
  const drift = driftFrame(question, resolvedDomain, effectiveTier, { classifierConfidence: classification.confidence });
  const continuity = continuityFrame(question, resolvedDomain, effectiveTier);
  const advisory = advisoryMode(question, resolvedDomain, effectiveTier);
  const whaleGate = whaleTier.whale
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
    whaleTier,
    admissibility,
    admissibility_t0: t0,
    drift,
    continuity,
    advisory,
    whaleGate,
  };
}
