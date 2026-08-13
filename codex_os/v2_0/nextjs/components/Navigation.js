import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow mb-6">
      <ul className="flex flex-wrap gap-x-4 gap-y-2 p-4 text-sm font-medium">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/features">Features</Link></li>
        <li><Link href="/pricing">Pricing</Link></li>
        <li><Link href="/enterprise">Enterprise</Link></li>
        <li><Link href="/altitude-pricing">Altitude Pricing</Link></li>
        <li><Link href="/altitude-procurement">Altitude Procurement</Link></li>
        <li><Link href="/altitude-sales-script">Altitude Sales Script</Link></li>
        <li><Link href="/altitude-dm-opener">Altitude DM Opener</Link></li>
        <li><Link href="/altitude-compliance">Altitude Compliance</Link></li>
        <li><Link href="/altitude-procurement-pdf">Altitude Procurement PDF</Link></li>
        <li><Link href="/altitude-call-flow">Altitude Call Flow</Link></li>
        <li><Link href="/altitude-deterministic-continuity-matrix">Altitude Deterministic Continuity Matrix</Link></li>
        <li><Link href="/altitude-enterprise-determinism-map">Altitude Enterprise Determinism Map</Link></li>
        <li><Link href="/altitude-regulated-governance-diagram">Altitude Regulated Governance Diagram</Link></li>
        <li><Link href="/altitude-intelligence-runtime-matrix">Altitude Intelligence Runtime Matrix</Link></li>
        <li><Link href="/altitude-enterprise-contact">Altitude Enterprise Contact</Link></li>
        <li><Link href="/retainer">Retainer</Link></li>
        <li><Link href="/support">Support</Link></li>
        <li><Link href="/faq">FAQ</Link></li>
        <li><Link href="/checkout">Checkout</Link></li>
        <li><Link href="/founder-override">Founder Override</Link></li>
        <li><Link href="/terms">Terms</Link></li>
        <li><Link href="/privacy">Privacy</Link></li>
        <li><Link href="/press-kit">Press Kit</Link></li>
        <li><Link href="/launch-trailer">Launch Trailer</Link></li>
      </ul>
    </nav>
  );
}