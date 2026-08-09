import { logRequest } from "../../observability/logger";
import { recordMetrics } from "../../observability/metrics";

export default function handler(req, res) {
  const start = Date.now();
  const body = req.body || {};

  const latency = Date.now() - start;
  const trace_id = logRequest("/api/log", body, 200, latency);
  recordMetrics(latency, 200);

  res.status(200).json({
    logged: true,
    trace_id
  });
}
