const suites = [
  {
    name: 'Total Intelligence Suite',
    monthly: '$2,500/mo',
    stripeProductKey: 'prod_altitude_total_intelligence_suite',
    checkoutUrl: 'https://buy.stripe.com/6oE14j8QY5qV2e4fZ0'
  },
  {
    name: 'Enterprise Continuity Suite',
    monthly: '$1,500/mo',
    stripeProductKey: 'prod_altitude_enterprise_continuity_suite',
    checkoutUrl: 'https://buy.stripe.com/cN228n5EM8D71a0fZ1'
  },
  {
    name: 'Identity Governance Suite',
    monthly: '$900/mo',
    stripeProductKey: 'prod_altitude_identity_governance_suite',
    checkoutUrl: 'https://buy.stripe.com/9AQ00b7MU2eJ4mgfZ2'
  }
];

export default function AltitudeSuitesSection() {
  return (
    <section id="altitude-suites" className="space-y-4">
      <h2 className="text-2xl font-bold">Altitude Enterprise Suites</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {suites.map((suite) => (
          <article
            key={suite.name}
            className="rounded border border-gray-200 bg-white p-4 shadow-sm"
            style={{ borderColor: '#00C8FF' }}
          >
            <h3 className="text-lg font-semibold">{suite.name}</h3>
            <p className="mt-2 text-sm font-medium text-gray-900">{suite.monthly}</p>
            <p className="mt-2 text-xs text-gray-600">Stripe product key: {suite.stripeProductKey}</p>
            <a href={suite.checkoutUrl} className="mt-3 inline-flex rounded px-3 py-2 text-xs font-semibold text-white" style={{ backgroundColor: '#FF6B00' }}>
              Checkout
            </a>
          </article>
        ))}
      </div>
    </section>
  );
}
