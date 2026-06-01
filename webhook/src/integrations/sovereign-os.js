export function buildSovereignEnvelope(event) {
  return {
    eventType: event.type,
    id: event.id,
    receivedAt: event.created || null,
  };
}
