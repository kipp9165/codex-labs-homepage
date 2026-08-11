const whalePricing = [
  {
    suite: 'Total Intelligence Suite',
    monthly: '$2,500/mo',
    stripeProductKey: 'prod_whale_total_intelligence_suite'
  },
  {
    suite: 'Enterprise Continuity Suite',
    monthly: '$1,500/mo',
    stripeProductKey: 'prod_whale_enterprise_continuity_suite'
  },
  {
    suite: 'Identity Governance Suite',
    monthly: '$900/mo',
    stripeProductKey: 'prod_whale_identity_governance_suite'
  }
];

export default function WhalePricing() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Whale Pricing</h1>
      <p className="text-gray-700">Founder-grade enterprise suite pricing with Stripe product keys only.</p>
      <div className="grid gap-4 md:grid-cols-3">
        {whalePricing.map((item) => (
          <article key={item.suite} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{item.suite}</h2>
            <p className="mt-2 font-medium">{item.monthly}</p>
            <p className="mt-2 text-sm text-gray-600">{item.stripeProductKey}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
