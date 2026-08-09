const metrics = {
  total_requests: 0,
  total_errors: 0,
  avg_latency_ms: 0
};

export function recordMetrics(latency, status) {
  metrics.total_requests++;
  if (status >= 400) metrics.total_errors++;

  const prev = metrics.avg_latency_ms;
  metrics.avg_latency_ms =
    prev + (latency - prev) / metrics.total_requests;
}

export function getMetrics() {
  return metrics;
}
