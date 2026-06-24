export function buildIdentityContext(event) {
  return {
    actorId: event?.data?.object?.customer || null,
    eventId: event.id,
    source: "stripe",
  };
}
