export function requireEnv(name, value) {
  if (!value || !String(value).trim()) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
}

export function normalizeString(value) {
  return typeof value === "string" ? value.trim() : "";
}

export function safeNumber(value, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

export function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function httpJson(url, options = {}) {
  const {
    method = "GET",
    headers = {},
    body,
    timeoutMs = 30000,
    retries = 0,
    retryDelayMs = 750,
  } = options;

  let lastError = null;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method,
        headers,
        body,
        signal: controller.signal,
      });

      const text = await response.text();
      let payload;
      try {
        payload = text ? JSON.parse(text) : {};
      } catch (_error) {
        payload = { raw: text };
      }

      if (!response.ok) {
        const message = payload && payload.error && payload.error.message
          ? payload.error.message
          : payload && payload.message
            ? payload.message
            : `Request failed (${response.status})`;
        throw new Error(`${message} :: ${url}`);
      }

      clearTimeout(timeout);
      return payload;
    } catch (error) {
      clearTimeout(timeout);
      lastError = error;

      if (attempt < retries) {
        await sleep(retryDelayMs);
        continue;
      }
    }
  }

  throw lastError;
}
