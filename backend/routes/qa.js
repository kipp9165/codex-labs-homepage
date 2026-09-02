import { logQaExchange } from "../baserow.js";
import { constitutionalSubstrate } from "../constitution/index.js";
import {
  checkWhaleTier,
  getWhaleTierAccessState,
  resolveStripeCustomerId,
} from "../entitlements/checkWhaleTier.js";
import { buildBlockedResponse, buildQaResponse } from "../qa/response.js";
import { syncWhaleLedgerEntry } from "../baserow.js";
import {
  logWhaleAdmissibilityBoundary,
  logWhaleEntitlementStatus,
  logWhaleRoutingDecision,
} from "../telemetry/whale.js";
import { multiScrollRouter } from "./scrolls.js";

const WHALE_CANONICAL_REFERENCES = ["PR #63"];

function resolveAccessContext(request) {
  const {
    access_reference: accessReference,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: stripeSubscriptionId,
    customer_email: customerEmail,
  } = request.body || {};

  return {
    accessReference: typeof accessReference === "string" ? accessReference.trim() : "",
    customerId: typeof stripeCustomerId === "string"
      ? stripeCustomerId.trim()
      : typeof request.headers["x-stripe-customer-id"] === "string"
        ? request.headers["x-stripe-customer-id"].trim()
        : "",
    customerEmail: typeof customerEmail === "string"
      ? customerEmail.trim()
      : typeof request.headers["x-stripe-customer-email"] === "string"
        ? request.headers["x-stripe-customer-email"].trim()
        : "",
    subscriptionId: typeof stripeSubscriptionId === "string"
      ? stripeSubscriptionId.trim()
      : typeof request.headers["x-stripe-subscription-id"] === "string"
        ? request.headers["x-stripe-subscription-id"].trim()
        : "",
  };
}

export function registerQaRoutes(app, { apiLimiter, setCorsHeaders }) {
  const registerQaEndpoint = (routePath) => {
    app.options(routePath, (_request, response) => {
      setCorsHeaders(response);
      response.status(204).end();
    });

    app.use(routePath, apiLimiter);

    app.post(routePath, async (request, response) => {
      setCorsHeaders(response);

      const question = typeof request.body?.question === "string" ? request.body.question.trim() : "";
      const bodyDomain = typeof request.body?.domain === "string" ? request.body.domain.trim().toLowerCase() : "";
      const requestedDomain = bodyDomain === "auto" ? "" : bodyDomain;
      const timestamp = new Date().toISOString();
      const accessContext = resolveAccessContext(request);
      const isWhale = await checkWhaleTier(accessContext.accessReference);

      if (!isWhale) {
        return response.json({
          domain: "authority",
          admissibility: "blocked",
          whale_priority: false,
          error: "stripe_access_denied",
          message: "Whale Tier required",
          response: "Access blocked: Whale Tier required.",
        });
      }

      const customerId = await resolveStripeCustomerId(accessContext);
      const whaleTierStatus = await getWhaleTierAccessState(customerId, {
        subscriptionId: accessContext.subscriptionId,
      });
      logWhaleEntitlementStatus(whaleTierStatus);

      const substrate = await constitutionalSubstrate({
        question,
        domain: requestedDomain,
        customerId: whaleTierStatus.customerId || customerId,
        whaleTierStatus,
      });

      const whalePriority = substrate.effectiveTier === "whale";
      const payload = {
        domain: substrate.whaleGate?.domain || substrate.domain,
        admissibility: substrate.whaleGate?.admissibility || substrate.admissibility.admissibility,
        timestamp,
        whale_priority: whalePriority,
        classifier: {
          confidence: substrate.classification.confidence,
          domain: substrate.classification.domain,
        },
        drift: substrate.whaleGate?.drift || substrate.drift,
        drift_frame: substrate.drift,
        admissibility_t0: substrate.admissibility_t0,
        continuity: substrate.continuity,
        scroll_routing: multiScrollRouter(substrate.whaleGate?.domain || substrate.domain, substrate.effectiveTier),
      };

      if (whalePriority) {
        payload.canonical_references = WHALE_CANONICAL_REFERENCES;
      }

      let responseFrame;
      if (substrate.whaleGate) {
        responseFrame = buildBlockedResponse(substrate.whaleGate.message);
        payload.error = substrate.whaleGate.error;
        payload.message = substrate.whaleGate.message;
      } else if (substrate.admissibility.admissibility === "blocked") {
        // eslint-disable-next-line no-console
        console.log(
          "[DEBUG admissibility-block]",
          "reason:", "admissibility",
          "question:", String(request.body.question ?? "").slice(0, 120),
          "domain:", substrate.admissibility.domain ?? substrate.domain,
          "admissibility_delta:", substrate.admissibility.drift?.admissibility_delta,
        );
        responseFrame = buildBlockedResponse(substrate.admissibility.reason);
      } else {
        responseFrame = buildQaResponse({
          question,
          domain: substrate.domain,
          admissibility: substrate.admissibility,
          tier: substrate.effectiveTier,
          advisory: substrate.advisory,
          continuity: substrate.continuity,
        });
      }

      payload.response = responseFrame;

      if (substrate.advisory) {
        payload.advisory = substrate.advisory;
      }

      logWhaleRoutingDecision({
        customerId: whaleTierStatus.customerId || customerId,
        hasWhaleTier: whaleTierStatus.hasWhaleTier,
        domain: payload.domain,
        admissibility: payload.admissibility,
        whalePriority,
        routePath,
        canonicalReferences: whalePriority ? WHALE_CANONICAL_REFERENCES : [],
      });
      logWhaleAdmissibilityBoundary({
        customerId: whaleTierStatus.customerId || customerId,
        hasWhaleTier: whaleTierStatus.hasWhaleTier,
        boundaryClassification: payload.admissibility_t0?.boundary_classification || "",
        missionCriticalBoundary: Boolean(payload.admissibility_t0?.mission_critical_boundary),
        admissibilityScore: payload.admissibility_t0?.admissibility_score || 0,
        domain: payload.domain,
      });

      try {
        await logQaExchange({
          question,
          domain: substrate.domain,
          response: responseFrame,
          admissibility: payload.admissibility,
          user_tier: substrate.effectiveTier,
          timestamp,
        });
        await syncWhaleLedgerEntry({
          ...whaleTierStatus,
          admissibility: payload.admissibility,
          canonicalReferences: whalePriority ? WHALE_CANONICAL_REFERENCES : [],
          timestamp,
        });
      } catch (error) {
        payload.logging_warning = error instanceof Error ? error.message : "Baserow logging failed";
      }

      response.status(payload.admissibility === "blocked" ? 403 : 200).json(payload);
    });
  };

  registerQaEndpoint("/api/qa");
  registerQaEndpoint("/qa");
}
