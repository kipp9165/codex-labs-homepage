export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (url.pathname === "/health" && request.method === "GET") {
      return json({ ok: true, service: "codex-intake-worker" });
    }

    if (url.pathname === "/intake" && request.method === "POST") {
      const contentType = request.headers.get("content-type") ?? "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return json({ error: "Malformed JSON" }, 400);
      }

      try {
        const body: unknown = await request.json();

        if (!body || typeof body !== "object" || Array.isArray(body)) {
          return json({ error: "Invalid JSON body" }, 400);
        }

        return json({
          status: "received",
          received_at: Date.now(),
          payload: body,
        });
      } catch {
        return json({ error: "Malformed JSON" }, 400);
      }
    }

    if (url.pathname === "/") {
      return json({
        status: "ok",
        service: "codex-intake-worker",
        mode: "async-only",
        timestamp: Date.now(),
      });
    }

    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return json({ error: "Not Found" }, 404);
  },
};

function json(data: unknown, status: number = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
