import config from "./config.js";

export async function logQaExchange(entry, runtimeConfig = config) {
  if (!runtimeConfig.baserowApiKey || !runtimeConfig.baserowTableId) {
    return { logged: false, skipped: true, reason: "baserow_not_configured" };
  }

  const url = `${runtimeConfig.baserowBaseUrl.replace(/\/$/, "")}/api/database/rows/table/${runtimeConfig.baserowTableId}/?user_field_names=true`;
  const payload = {
    question: entry.question,
    domain: entry.domain,
    response: entry.response,
    admissibility: entry.admissibility,
    user_tier: entry.user_tier,
    timestamp: entry.timestamp,
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Token ${runtimeConfig.baserowApiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Baserow logging failed: ${response.status} ${message}`.trim());
  }

  return { logged: true, skipped: false };
}
