const sections = [
  {
    title: 'Opening',
    copy: 'Thanks for taking the call. Codex Labs builds enterprise intelligence infrastructure for environments where continuity and governance are non-negotiable.'
  },
  {
    title: 'Problem Framing',
    copy: 'Most AI deployments optimize for speed, but regulated and mission-critical systems fail when identity controls, governance boundaries, and continuity guarantees are not explicit.'
  },
  {
    title: 'Codex Thesis',
    copy: 'Codex is deterministic infrastructure that binds governance, continuity, and identity integrity into every intelligence surface.'
  },
  {
    title: 'Architecture',
    copy: 'The 13-layer Codex stack assembles hardening through finalization into a governed execution substrate that is stable under enterprise pressure.'
  },
  {
    title: 'Value',
    copy: 'You gain consistent outcomes, reduced governance drift, and higher trust in AI-backed decisions across regulated workflows.'
  },
  {
    title: 'Suites',
    copy: 'We align teams to one of three founder-grade suites: Total Intelligence Suite, Enterprise Continuity Suite, or Identity Governance Suite.'
  },
  {
    title: 'Close',
    copy: 'If this aligns with your enterprise priorities, the next step is procurement alignment and a governance onboarding plan.'
  }
];

export default function AltitudeSalesScript() {
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-bold">Altitude Sales Script</h1>
      <div className="space-y-4">
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
