import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import config from "./config.js";
import { classifyDomain, VALID_DOMAINS } from "./classifier.js";
import { evaluateAdmissibility } from "./admissibility.js";
import { logQaExchange } from "./baserow.js";
import { enforceStripeAccess } from "./stripe.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const basePath = "/codex-labs-homepage";
const app = express();

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".csv": "text/csv; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

const blockedSegments = new Set([
  ".git",
  ".github",
  "backend",
  "node_modules",
  "service",
  "webhook",
]);

const blockedFiles = new Set([
  ".env.example",
  "Cargo.lock",
  "Cargo.toml",
  "package-lock.json",
  "package.json",
  "render.yaml",
  "requirements.txt",
]);

app.disable("x-powered-by");
app.use(express.json({ limit: "100kb" }));

function setCorsHeaders(response) {
  response.setHeader("Access-Control-Allow-Origin", "*");
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, X-Stripe-Customer-Id, X-Stripe-Customer-Email, X-Stripe-Subscription-Id");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
}

function normalizeRequestedDomain(requestedDomain, fallback) {
  if (requestedDomain === "auto") {
    return fallback;
  }

  return VALID_DOMAINS.includes(requestedDomain) ? requestedDomain : fallback;
}

function resolveAccessContext(request) {
  const { access_reference: accessReference, stripe_customer_id: stripeCustomerId, stripe_subscription_id: stripeSubscriptionId, customer_email: customerEmail } = request.body || {};

  return {
    accessReference: typeof accessReference === "string" ? accessReference.trim() : "",
    customerId: typeof stripeCustomerId === "string" ? stripeCustomerId.trim() : typeof request.headers["x-stripe-customer-id"] === "string" ? request.headers["x-stripe-customer-id"].trim() : "",
    customerEmail: typeof customerEmail === "string" ? customerEmail.trim() : typeof request.headers["x-stripe-customer-email"] === "string" ? request.headers["x-stripe-customer-email"].trim() : "",
    subscriptionId: typeof stripeSubscriptionId === "string" ? stripeSubscriptionId.trim() : typeof request.headers["x-stripe-subscription-id"] === "string" ? request.headers["x-stripe-subscription-id"].trim() : "",
  };
}

function buildStandardResponse({ question, domain, admissibility }) {
  return [
    "Decision Frame",
    `- Domain: ${domain}`,
    `- Admissibility: ${admissibility.admissibility}`,
    "",
    "Constitutional Reading",
    `${question}`,
    "",
    "Operating Guidance",
    admissibility.admissibility === "allowed"
      ? `Proceed within the ${domain} lane while preserving identity, authority, continuity, and execution traceability.`
      : `Request blocked due to ${admissibility.reason}. Reframe the question with clearer context and permissible scope.`,
  ].join("\n");
}

function buildWhaleResponse({ question, domain, admissibility }) {
  return [
    "Decision Frame",
    `- Domain: ${domain}`,
    `- Admissibility: ${admissibility.admissibility}`,
    "- Whale Priority: active",
    "",
    "Architectural Comparison",
    `Primary thread: ${question}`,
    `Comparison: assess ${domain} impacts against authority, continuity, and interoperability before execution.`,
    "",
    "Governance Layer",
    admissibility.admissibility === "allowed"
      ? "Escalation path remains open for founder-grade governance review, but the request is currently admissible within the constitutional frame."
      : `Governance hold is active because the request triggered ${admissibility.reason}.`,
    "",
    "Priority Routing",
    "Whale Tier responses retain deeper framing, architecture-level comparisons, and continuity-preserving recommendations.",
  ].join("\n");
}

function buildBlockedResponse(reason) {
  return `Access blocked: ${reason}. Active subscription verification is required before Codex Q/A v2.0 can respond.`;
}

function sanitizePathname(requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0]);
  const unprefixed = decodedPath.startsWith(basePath) ? decodedPath.slice(basePath.length) || "/" : decodedPath;
  const normalized = path.posix.normalize(unprefixed || "/");

  if (normalized.includes("..")) {
    return null;
  }

  const segments = normalized.split("/").filter(Boolean);
  if (segments.some((segment) => blockedSegments.has(segment) || segment.startsWith("."))) {
    return null;
  }

  if (segments.length > 0 && blockedFiles.has(segments[segments.length - 1])) {
    return null;
  }

  return normalized === "." ? "/" : normalized;
}

async function resolveStaticFile(requestPath) {
  const safePath = sanitizePathname(requestPath);

  if (!safePath) {
    return null;
  }

  const lookupPath = safePath === "/" ? "/index.html" : safePath;
  const absolutePath = path.join(repoRoot, lookupPath);
  const candidates = [absolutePath];

  if (!path.extname(absolutePath)) {
    candidates.push(`${absolutePath}.html`);
    candidates.push(path.join(absolutePath, "index.html"));
  }

  for (const candidate of candidates) {
    try {
      const fileStats = await stat(candidate);
      if (!fileStats.isFile()) {
        continue;
      }

      const extension = path.extname(candidate).toLowerCase();
      if (!contentTypes[extension]) {
        continue;
      }

      return candidate;
    } catch (_error) {
      // Keep scanning.
    }
  }

  return null;
}

app.options("/api/qa", (_request, response) => {
  setCorsHeaders(response);
  response.status(204).end();
});

app.get("/healthz", (_request, response) => {
  response.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.post("/api/qa", async (request, response) => {
  setCorsHeaders(response);

  const question = typeof request.body?.question === "string" ? request.body.question.trim() : "";
  const requestedDomain = typeof request.body?.domain === "string" ? request.body.domain.trim().toLowerCase() : "auto";
  const userTier = typeof request.body?.user_tier === "string" ? request.body.user_tier.trim().toLowerCase() : "standard";
  const classification = classifyDomain(question);
  const resolvedDomain = normalizeRequestedDomain(requestedDomain, classification.domain);
  const admissibility = evaluateAdmissibility({ question, domain: resolvedDomain, userTier });
  const timestamp = new Date().toISOString();
  const whalePriority = userTier === "whale";

  const stripeAccess = await enforceStripeAccess(resolveAccessContext(request));

  let finalAdmissibility = admissibility;
  let responseFrame = whalePriority
    ? buildWhaleResponse({ question, domain: resolvedDomain, admissibility })
    : buildStandardResponse({ question, domain: resolvedDomain, admissibility });

  if (!stripeAccess.allowed) {
    finalAdmissibility = {
      ...admissibility,
      admissibility: "blocked",
      reason: stripeAccess.reason,
      drift: {
        ...admissibility.drift,
        admissibility_delta: Number((admissibility.drift.admissibility_delta - 0.4).toFixed(2)),
      },
    };
    responseFrame = buildBlockedResponse(stripeAccess.reason);
  } else if (admissibility.admissibility === "blocked") {
    responseFrame = `Request blocked: ${admissibility.reason}. Reframe the question to stay within the constitutional response surface.`;
  }

  const payload = {
    response: responseFrame,
    admissibility: finalAdmissibility.admissibility,
    domain: resolvedDomain,
    drift: {
      ...finalAdmissibility.drift,
      classifier_confidence: classification.confidence,
      domain_auto_selected: requestedDomain === "auto",
    },
    timestamp,
    whale_priority: whalePriority,
  };

  try {
    await logQaExchange({
      question,
      domain: resolvedDomain,
      response: responseFrame,
      admissibility: finalAdmissibility.admissibility,
      user_tier: userTier,
      timestamp,
    });
  } catch (error) {
    payload.logging_warning = error instanceof Error ? error.message : "Baserow logging failed";
  }

  response.status(finalAdmissibility.admissibility === "blocked" ? 403 : 200).json(payload);
});

app.use(async (request, response, next) => {
  if (!["GET", "HEAD"].includes(request.method) || request.path.startsWith("/api/")) {
    next();
    return;
  }

  const resolvedFile = await resolveStaticFile(request.path || "/");

  if (!resolvedFile) {
    next();
    return;
  }

  try {
    const fileBuffer = await readFile(resolvedFile);
    response.writeHead(200, { "Content-Type": contentTypes[path.extname(resolvedFile).toLowerCase()] || "application/octet-stream" });
    response.end(request.method === "HEAD" ? undefined : fileBuffer);
  } catch (error) {
    response.status(500).type("text/plain").send(`Server error: ${error instanceof Error ? error.message : "unknown"}`);
  }
});

app.use((request, response) => {
  response.status(404).type("text/plain").send(`Not found: ${request.path}`);
});

app.listen(config.renderPort, () => {
  console.log(`Codex Q/A server running at http://localhost:${config.renderPort}`);
});
