import WhaleSuitesSection from '../components/WhaleSuitesSection';
import EnterpriseValueSection from '../components/EnterpriseValueSection';

export default function Home() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold">Codex Labs — Enterprise Intelligence Infrastructure</h1>
        <p className="text-sm font-semibold text-gray-700">Continuity • Governance • Identity • Determinism</p>
        <p className="text-base text-gray-800">
          Built for regulated environments, defense, and enterprise AI systems that cannot afford to fail.
        </p>
        <div className="flex flex-wrap gap-3 pt-2">
          <a href="#whale-suites" className="inline-flex items-center rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
            View Enterprise Suites
          </a>
          <a href="mailto:kippkppwggns@aol.com" className="inline-flex items-center rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-100">
            Contact Codex Labs
          </a>
        </div>
      </section>

      <WhaleSuitesSection />
      <EnterpriseValueSection />
    </div>
  );
}