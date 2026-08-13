const sections = [
  {
    title: 'Deterministic execution',
    copy: 'Codex execution surfaces are designed for repeatable outcomes under equivalent inputs and policy conditions.'
  },
  {
    title: 'Identity lifecycle integrity',
    copy: 'Identity and authority controls are tracked across lifecycle states to reduce privilege drift and authorization ambiguity.'
  },
  {
    title: 'Continuity guarantees',
    copy: 'Continuity controls preserve stable operational behavior through governance checkpoints and execution boundary enforcement.'
  },
  {
    title: 'Governance surfaces',
    copy: 'Governance layers make policy conditions explicit so enterprise teams can audit and enforce decision boundaries.'
  },
  {
    title: 'Regulated-environment alignment',
    copy: 'Codex architecture supports documentation, accountability, and deterministic controls required by regulated operating contexts.'
  }
];

export default function AltitudeCompliance() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Codex Compliance & Regulated Environment Readiness</h1>
      <div className="space-y-3">
        {sections.map((section) => (
          <section key={section.title} className="rounded border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="text-lg font-semibold">{section.title}</h2>
            <p className="mt-2 text-gray-800">{section.copy}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
