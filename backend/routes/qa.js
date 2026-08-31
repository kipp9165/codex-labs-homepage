import { logQaExchange } from "../baserow.js";
import config from "../config.js";
import { constitutionalSubstrate } from "../constitution/index.js";
import { buildBlockedResponse, buildQaResponse } from "../qa/response.js";
import { enforceStripeAccess } from "../stripe.js";
import { multiScrollRouter } from "./scrolls.js";

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
      const userTier = typeof request.body?.user_tier === "string" ? request.body.user_tier.trim().toLowerCase() : "standard";
      const timestamp = new Date().toISOString();
      const accessContext = resolveAccessContext(request);
      const founderWhaleBypass = Boolean(config.whaleBypassReference) && accessContext.accessReference === config.whaleBypassReference;

      let stripeAccess = await enforceStripeAccess({ ...accessContext, userTier });
      // eslint-disable-next-line no-console
      console.log(
        "[DEBUG enforceStripeAccess]",
        "customerId:", accessContext.customerId,
        "userTier:", userTier,
        "allowed:", stripeAccess.allowed,
        "reason:", stripeAccess.reason,
      );
      if (founderWhaleBypass) {
        stripeAccess = {
          ...stripeAccess,
          allowed: true,
          reason: null,
          customerId: stripeAccess.customerId || accessContext.customerId,
        };
      }

      const substrate = await constitutionalSubstrate({
        question,
        domain: requestedDomain,
        tier: userTier,
        customerId: stripeAccess.customerId || accessContext.customerId,
        forceWhale: founderWhaleBypass,
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

      try {
        await logQaExchange({
          question,
          domain: substrate.domain,
          response: responseFrame,
          admissibility: payload.admissibility,
          user_tier: substrate.effectiveTier,
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
