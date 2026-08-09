export default function Checkout() {
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Checkout</h1>
      <ul className="list-disc ml-6 space-y-2">
        <li>Basic — $29/mo</li>
        <li>Pro — $99/mo</li>
        <li>Enterprise — $499/mo</li>
        <li>Founder Override — $2,500/mo</li>
      </ul>
    </div>
  );
}