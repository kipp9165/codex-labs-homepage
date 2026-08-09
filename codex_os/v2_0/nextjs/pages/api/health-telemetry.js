import { getMetrics } from "../../observability/metrics";

export default function handler(req, res) {
  res.status(200).json({
    status: "ok",
    version: "v2.0",
    metrics: getMetrics()
  });
}
