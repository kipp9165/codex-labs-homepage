const steps = [
  'Opening',
  'Problem framing',
  'Architecture walkthrough',
  'Value alignment',
  'Suite selection',
  'Procurement next steps'
];

export default function AltitudeCallFlow() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Altitude Call Flow</h1>
      <ol className="list-decimal ml-6 space-y-2">
        {steps.map((step) => (
          <li key={step}>{step}</li>
        ))}
      </ol>
    </div>
  );
}
