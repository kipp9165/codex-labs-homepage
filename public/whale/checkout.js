function openWhaleCheckout(tier) {
  const stripe = {
    sovereign: "https://buy.stripe.com/test_XXXXXX",
    apex: "https://buy.stripe.com/test_YYYYYY",
    continuity: "https://buy.stripe.com/test_ZZZZZZ"
  };

  window.location.href = stripe[tier];
}
