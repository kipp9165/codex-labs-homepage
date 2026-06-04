import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..", "public");
const port = Number.parseInt(process.env.PORT || "3000", 10);

const contentTypes = {
  ".css": "text/css; charset=utf-8",
  ".gif": "image/gif",
  ".html": "text/html; charset=utf-8",
  ".jpeg": "image/jpeg",
  ".jpg": "image/jpeg",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
};

function getContentType(filePath) {
  return contentTypes[path.extname(filePath).toLowerCase()] || "application/octet-stream";
}

function toSafePath(requestPath) {
  const decodedPath = decodeURIComponent(requestPath.split("?")[0]);
  const normalizedPath = path.normalize(decodedPath).replace(/^([.]{2}[\\/])+/, "");
  const joinedPath = path.join(rootDir, normalizedPath);

  if (!joinedPath.startsWith(rootDir)) {
    return null;
  }

  return joinedPath;
}

async function resolveFile(requestPath) {
  const safePath = toSafePath(requestPath);

  if (!safePath) {
    return null;
  }

  const candidates = [];

  try {
    const fileStats = await stat(safePath);
    if (fileStats.isFile()) {
      candidates.push(safePath);
    }
  } catch (_error) {
    // Fall through to extensionless and directory index lookups.
  }

  if (!path.extname(safePath)) {
    candidates.push(`${safePath}.html`);
    candidates.push(path.join(safePath, "index.html"));
  }

  for (const candidate of candidates) {
    try {
      const candidateStats = await stat(candidate);
      if (candidateStats.isFile()) {
        return candidate;
      }
    } catch (_error) {
      continue;
    }
  }

  return null;
}

const server = http.createServer(async (request, response) => {
  const urlPath = request.url || "/";
  const resolvedFile = await resolveFile(urlPath === "/" ? "/index.html" : urlPath);

  if (!resolvedFile) {
    response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Not found");
    return;
  }

  try {
    const fileBuffer = await readFile(resolvedFile);
    response.writeHead(200, { "Content-Type": getContentType(resolvedFile) });
    response.end(fileBuffer);
  } catch (error) {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end(`Server error: ${error instanceof Error ? error.message : "unknown"}`);
  }
});

server.listen(port, () => {
  console.log(`Static site server running at http://localhost:${port}`);
});