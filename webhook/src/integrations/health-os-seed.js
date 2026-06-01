export function buildHealthSeed(event) {
  const sessionId = event?.data?.object?.id || null;
  return {
    checkoutSessionId: sessionId,
    hasSession: Boolean(sessionId),
  };
}
