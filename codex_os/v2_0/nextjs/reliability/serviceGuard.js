export function serviceGuard(isHealthy) {
  if (!isHealthy) {
    return { healthy: false, reason: "Dependency unhealthy" };
  }
  return { healthy: true };
}
