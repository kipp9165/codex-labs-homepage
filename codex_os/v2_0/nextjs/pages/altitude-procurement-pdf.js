const sections = [
  {
    title: 'Overview',
    copy: 'Codex Labs founder-grade procurement profile for enterprise deterministic intelligence infrastructure.'
  },
  {
    title: 'Requirements',
    copy: 'Enterprise sponsor alignment, governance stakeholder participation, and identity-continuity ownership are required.'
  },
  {
    title: 'Procurement steps',
    copy: 'Scoping, compliance review, suite selection, and onboarding finalization are completed in sequence.'
  },
  {
    title: 'Suite summary',
    copy: 'Total Intelligence Suite ($2,500/mo), Enterprise Continuity Suite ($1,500/mo), and Identity Governance Suite ($900/mo).'
  }
];

export default function AltitudeProcurementPDF() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Altitude Procurement PDF</h1>
      <p className="text-gray-800">
        This page provides the structured content used to generate the Codex Labs procurement PDF.
      </p>
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
