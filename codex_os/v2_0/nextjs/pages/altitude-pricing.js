const altitudePricing = [
  {
    suite: 'Total Intelligence Suite',
    monthly: '$2,500/mo',
    stripeProductKey: 'prod_altitude_total_intelligence_suite',
    checkoutUrl: 'https://buy.stripe.com/6oE14j8QY5qV2e4fZ0'
  },
  {
    suite: 'Enterprise Continuity Suite',
    monthly: '$1,500/mo',
    stripeProductKey: 'prod_altitude_enterprise_continuity_suite',
    checkoutUrl: 'https://buy.stripe.com/cN228n5EM8D71a0fZ1'
  },
  {
    suite: 'Identity Governance Suite',
    monthly: '$900/mo',
    stripeProductKey: 'prod_altitude_identity_governance_suite',
    checkoutUrl: 'https://buy.stripe.com/9AQ00b7MU2eJ4mgfZ2'
  }
];

export default function AltitudePricing() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Altitude Pricing</h1>
      <p className="text-gray-700">Founder-grade enterprise suite pricing with Stripe product keys only.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {altitudePricing.map((item) => (
          <article key={item.suite} className="rounded border border-gray-200 bg-white p-4 shadow-sm" style={{ borderColor: '#00C8FF' }}>
            <h2 className="text-lg font-semibold">{item.suite}</h2>
            <p className="mt-2 font-medium">{item.monthly}</p>
            <p className="mt-2 text-sm text-gray-600">{item.stripeProductKey}</p>
            <a href={item.checkoutUrl} className="mt-3 inline-flex rounded px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#FF6B00' }}>
              Buy via Stripe
            </a>
          </article>
        ))}
      </div>
    </div>
  );
}
