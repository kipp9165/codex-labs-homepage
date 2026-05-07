const handlers = new Map();

export function subscribe(eventName, handler) {
  if (!handlers.has(eventName)) handlers.set(eventName, []);
  handlers.get(eventName).push(handler);
}

export function publish(eventName, payload) {
  const subs = handlers.get(eventName) || [];
  for (const handler of subs) {
    Promise.resolve(handler(payload)).catch((e) =>
      console.error("event_handler_error", eventName, e.message)
    );
  }
}
