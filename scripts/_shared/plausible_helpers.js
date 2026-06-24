import { httpJson } from "./api_helpers.js";

export async function queryPlausible({ apiKey, siteId, query }) {
  return httpJson("https://plausible.io/api/v2/query", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      site_id: siteId,
      ...query,
    }),
    retries: 1,
  });
}
