import { generateTraceId } from "./traceId";

export function logRequest(route, body, status, latency) {
  const trace_id = generateTraceId(route, body);
  const entry = {
    trace_id,
    route,
    status,
    latency_ms: latency,
    payload: body
  };
  console.log(JSON.stringify(entry));
  return trace_id;
}
