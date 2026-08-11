import { useRouter } from 'next/router';

export default function Retainer() {
  const router = useRouter();
  const reference = typeof router.query.ref === 'string' ? router.query.ref : 'NAME';

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Retainer</h1>
      <p className="text-gray-800">Enterprise retainer access for governed deterministic support and continuity.</p>
      <p className="text-sm text-gray-700">Referral reference: {reference}</p>
      <a href="mailto:kippkppwggns@aol.com" className="inline-flex items-center rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-700">
        Contact Codex Labs
      </a>
    </div>
  );
}
