import { generateTraceId } from "../../observability/traceId";

export default function handler(req, res) {
  const trace_id = generateTraceId("/api/trace", req.body || {});
  res.status(200).json({ trace_id });
}
