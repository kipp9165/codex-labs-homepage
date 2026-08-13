const suites = [
  {
    name: 'Total Intelligence Suite',
    monthly: '$2,500/mo',
    stripeProductKey: 'prod_altitude_total_intelligence_suite'
  },
  {
    name: 'Enterprise Continuity Suite',
    monthly: '$1,500/mo',
    stripeProductKey: 'prod_altitude_enterprise_continuity_suite'
  },
  {
    name: 'Identity Governance Suite',
    monthly: '$900/mo',
    stripeProductKey: 'prod_altitude_identity_governance_suite'
  }
];

export default function AltitudeSuitesSection() {
  return (
    <section id="altitude-suites" className="space-y-4">
      <h2 className="text-2xl font-bold">Altitude Enterprise Suites</h2>
      <div className="grid gap-4 md:grid-cols-3">
        {suites.map((suite) => (
          <article key={suite.name} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <h3 className="text-lg font-semibold">{suite.name}</h3>
            <p className="mt-2 text-sm font-medium text-gray-900">{suite.monthly}</p>
            <p className="mt-2 text-xs text-gray-600">Stripe product key: {suite.stripeProductKey}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
