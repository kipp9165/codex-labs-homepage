export function constitutionalReceipt(engine, surface, authority, horizon, drift) {
  return {
    constitutional_receipt: true,
    engine,
    surface,
    authority,
    horizon,
    drift,
    version: "v2.0"
  };
}
