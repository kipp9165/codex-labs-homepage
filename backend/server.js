import express from "express";
import { rateLimit } from "express-rate-limit";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readFile, stat } from "node:fs/promises";
import config from "./config.js";
import { registerQaRoutes } from "./routes/qa.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const basePath = "/codex-labs-homepage";
const app = express();
app.set("trust proxy", 1);
app.use(express.json());

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
  response.setHeader("Access-Control-Allow-Headers", "Content-Type, Accept, Origin, Referer, X-Stripe-Customer-Id, X-Stripe-Customer-Email, X-Stripe-Subscription-Id");
  response.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
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

const apiLimiter = rateLimit({
  windowMs: 60_000,
  limit: 60,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => {
    setCorsHeaders(response);
    response.status(429).json({ error: "rate_limited" });
  },
});

const staticLimiter = rateLimit({
  windowMs: 60_000,
  limit: 240,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (_request, response) => {
    response.status(429).type("text/plain").send("Too many requests");
  },
});

app.get("/healthz", (_request, response) => {
  response.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

registerQaRoutes(app, { apiLimiter, setCorsHeaders });

app.use(staticLimiter);

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
    console.error("static_file_error", error);
    response.status(500).type("text/plain").send("Server error");
  }
});

app.use((request, response) => {
  response.status(404).type("text/plain").send("Not found");
});

app.listen(config.renderPort, () => {
  console.log(`Codex Q/A server running at http://localhost:${config.renderPort}`);
});
