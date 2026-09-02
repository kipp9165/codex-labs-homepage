import config from "./config.js";

function createHeaders(runtimeConfig) {
  return {
    Authorization: `Token ${runtimeConfig.baserowApiKey}`,
    "Content-Type": "application/json",
  };
}

function buildTableUrl(tableId, runtimeConfig, suffix = "/?user_field_names=true") {
  return `${runtimeConfig.baserowBaseUrl.replace(/\/$/, "")}/api/database/rows/table/${tableId}${suffix}`;
}

async function fetchBaserowRows(tableId, runtimeConfig = config) {
  const rows = [];
  let nextUrl = buildTableUrl(tableId, runtimeConfig, "/?user_field_names=true&size=200&page=1");

  while (nextUrl) {
    const response = await fetch(nextUrl, {
      method: "GET",
      headers: {
        Authorization: `Token ${runtimeConfig.baserowApiKey}`,
      },
    });

    if (!response.ok) {
      const message = await response.text();
      throw new Error(`Baserow fetch failed: ${response.status} ${message}`.trim());
    }

    const payload = await response.json();
    rows.push(...(Array.isArray(payload.results) ? payload.results : []));
    nextUrl = payload.next || null;
  }

  return rows;
}

export async function logQaExchange(entry, runtimeConfig = config) {
  if (!runtimeConfig.baserowApiKey || !runtimeConfig.baserowTableId) {
    return { logged: false, skipped: true, reason: "baserow_not_configured" };
  }

  const url = buildTableUrl(runtimeConfig.baserowTableId, runtimeConfig);
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
    headers: createHeaders(runtimeConfig),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Baserow logging failed: ${response.status} ${message}`.trim());
  }

  return { logged: true, skipped: false };
}

export async function syncWhaleLedgerEntry(entry, runtimeConfig = config) {
  if (!runtimeConfig.baserowApiKey || !runtimeConfig.baserowWhaleTableId) {
    return { logged: false, skipped: true, reason: "whale_ledger_not_configured" };
  }

  const normalizedCustomerId = typeof entry.customerId === "string" ? entry.customerId.trim() : "";
  if (!normalizedCustomerId) {
    return { logged: false, skipped: true, reason: "missing_customer_id" };
  }

  const existingRows = await fetchBaserowRows(runtimeConfig.baserowWhaleTableId, runtimeConfig);
  const existingRow = existingRows.find((row) => row.customer_id === normalizedCustomerId);
  const payload = {
    customer_id: normalizedCustomerId,
    has_whale_tier: Boolean(entry.hasWhaleTier),
    subscription_id: entry.subscription?.id || "",
    subscription_status: entry.subscription?.status || "",
    subscription_metadata: JSON.stringify(entry.subscription?.metadata || {}),
    entitlement_ids: (entry.matchedEntitlements || []).map((item) => item.id).join(","),
    entitlement_lookup_keys: (entry.matchedEntitlements || [])
      .map((item) => item.lookupKey || item.featureLookupKey)
      .filter(Boolean)
      .join(","),
    canonical_references: Array.isArray(entry.canonicalReferences) ? entry.canonicalReferences.join(",") : "",
    last_admissibility: entry.admissibility || "",
    updated_at: entry.timestamp || new Date().toISOString(),
  };

  const url = existingRow?.id
    ? buildTableUrl(runtimeConfig.baserowWhaleTableId, runtimeConfig, `/${existingRow.id}/?user_field_names=true`)
    : buildTableUrl(runtimeConfig.baserowWhaleTableId, runtimeConfig);
  const response = await fetch(url, {
    method: existingRow?.id ? "PATCH" : "POST",
    headers: createHeaders(runtimeConfig),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(`Whale ledger sync failed: ${response.status} ${message}`.trim());
  }

  return { logged: true, skipped: false, rowId: existingRow?.id || null };
}
