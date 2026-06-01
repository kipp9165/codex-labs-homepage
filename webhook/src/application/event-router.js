export function routeStripeEvent({ event, runtime }) {
  switch (event.type) {
    case "checkout.session.completed":
      runtime.handleCheckoutSessionCompleted(event);
      return;
    default:
      runtime.handleUnhandled(event);
      return;
  }
}
