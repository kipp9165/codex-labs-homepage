import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow mb-6">
      <ul className="flex flex-wrap gap-x-4 gap-y-2 p-4 text-sm font-medium">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/features">Features</Link></li>
        <li><Link href="/pricing">Pricing</Link></li>
        <li><Link href="/enterprise">Enterprise</Link></li>
        <li><Link href="/whale-pricing">Whale Pricing</Link></li>
        <li><Link href="/whale-procurement">Whale Procurement</Link></li>
        <li><Link href="/whale-sales-script">Whale Sales Script</Link></li>
        <li><Link href="/whale-dm-opener">Whale DM Opener</Link></li>
        <li><Link href="/whale-compliance">Whale Compliance</Link></li>
        <li><Link href="/whale-procurement-pdf">Whale Procurement PDF</Link></li>
        <li><Link href="/whale-call-flow">Whale Call Flow</Link></li>
        <li><Link href="/whale-deterministic-continuity-matrix">Whale Deterministic Continuity Matrix</Link></li>
        <li><Link href="/whale-enterprise-determinism-map">Whale Enterprise Determinism Map</Link></li>
        <li><Link href="/whale-regulated-governance-diagram">Whale Regulated Governance Diagram</Link></li>
        <li><Link href="/whale-intelligence-runtime-matrix">Whale Intelligence Runtime Matrix</Link></li>
        <li><Link href="/whale-enterprise-contact">Whale Enterprise Contact</Link></li>
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