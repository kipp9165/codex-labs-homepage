import Link from 'next/link';

export default function Navigation() {
  return (
    <nav className="bg-white shadow mb-6">
      <ul className="flex space-x-4 p-4 text-sm font-medium">
        <li><Link href="/">Home</Link></li>
        <li><Link href="/features">Features</Link></li>
        <li><Link href="/pricing">Pricing</Link></li>
        <li><Link href="/enterprise">Enterprise</Link></li>
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