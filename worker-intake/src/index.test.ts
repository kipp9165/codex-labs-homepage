import { describe, it, expect } from "vitest";
import worker from "./index";

const makeRequest = (method: string, path: string, body?: unknown): Request =>
  new Request(`http://localhost${path}`, {
    method,
    ...(body !== undefined
      ? {
          body: JSON.stringify(body),
          headers: { "Content-Type": "application/json" },
        }
      : {}),
  });

describe("codex-intake-worker", () => {
  it("GET / returns status payload", async () => {
    const res = await worker.fetch(makeRequest("GET", "/"), {} as never, {} as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ service: "codex-intake-worker", status: "ok" });
  });

  it("GET /health returns ok", async () => {
    const res = await worker.fetch(makeRequest("GET", "/health"), {} as never, {} as never);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data).toMatchObject({ ok: true, service: "codex-intake-worker" });
  });

  it("POST /intake accepts a JSON object", async () => {
    const payload = { name: "test" };
    const res = await worker.fetch(makeRequest("POST", "/intake", payload), {} as never, {} as never);
    expect(res.status).toBe(200);
    const data = await res.json() as { status: string; received_at: number; payload: unknown };
    expect(data.status).toBe("received");
    expect(typeof data.received_at).toBe("number");
    expect(data.payload).toEqual(payload);
  });

  it("POST /intake returns 400 on malformed JSON", async () => {
    const res = await worker.fetch(
      new Request("http://localhost/intake", {
        method: "POST",
        body: "not-json",
        headers: { "Content-Type": "application/json" },
      }),
      {} as never,
      {} as never,
    );
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/Invalid JSON/i);
  });

  it("POST /intake returns 400 on non-object JSON", async () => {
    const res = await worker.fetch(makeRequest("POST", "/intake", [1, 2, 3]), {} as never, {} as never);
    expect(res.status).toBe(400);
    const data = await res.json() as { error: string };
    expect(data.error).toMatch(/object/i);
  });

  it("unknown route returns 404", async () => {
    const res = await worker.fetch(makeRequest("GET", "/unknown"), {} as never, {} as never);
    expect(res.status).toBe(404);
  });
});
