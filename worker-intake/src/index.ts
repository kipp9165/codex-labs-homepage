const json = (data: unknown, status = 200): Response =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

export default {
  async fetch(request: Request, _env: Env, _ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const { pathname } = url;
    const method = request.method;

    if (method === "GET" && pathname === "/") {
      return json({ service: "codex-intake-worker", status: "ok" });
    }

    if (method === "GET" && pathname === "/health") {
      return json({ ok: true, service: "codex-intake-worker" });
    }

    if (method === "POST" && pathname === "/intake") {
      let payload: unknown;
      try {
        payload = await request.json();
      } catch {
        return json({ error: "Invalid JSON" }, 400);
      }

      if (
        typeof payload !== "object" ||
        payload === null ||
        Array.isArray(payload)
      ) {
        return json({ error: "Payload must be a JSON object" }, 400);
      }

      return json({ status: "received", received_at: Date.now(), payload });
    }

    return json({ error: "Not found" }, 404);
  },
} satisfies ExportedHandler<Env>;
