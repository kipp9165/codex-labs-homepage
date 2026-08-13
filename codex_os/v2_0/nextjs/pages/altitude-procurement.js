const procurementSteps = [
  'Confirm regulated-environment priorities and governance constraints.',
  'Select the suite aligned to continuity, identity, and deterministic execution outcomes.',
  'Complete procurement review for legal, security, and operating requirements.',
  'Finalize founder-grade onboarding and governance implementation kickoff.'
];

const enterpriseRequirements = [
  'Executive sponsor for governed intelligence rollout',
  'Compliance and security counterpart',
  'Continuity and identity controls owner',
  'Defined enterprise deployment timeline'
];

const suites = [
  'Total Intelligence Suite ($2,500/mo)',
  'Enterprise Continuity Suite ($1,500/mo)',
  'Identity Governance Suite ($900/mo)'
];

export default function AltitudeProcurement() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Altitude Procurement</h1>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Procurement Steps</h2>
        <ol className="list-decimal ml-6 space-y-1">
          {procurementSteps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Enterprise Requirements</h2>
        <ul className="list-disc ml-6 space-y-1">
          {enterpriseRequirements.map((requirement) => (
            <li key={requirement}>{requirement}</li>
          ))}
        </ul>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Suite List</h2>
        <ul className="list-disc ml-6 space-y-1">
          {suites.map((suite) => (
            <li key={suite}>{suite}</li>
          ))}
        </ul>
      </section>

      <a href="mailto:kippkppwggns@aol.com" className="inline-flex items-center rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
        Contact Codex Labs
      </a>
    </div>
  );
}
