export function runtimeReceipt(engine, boundary, authority, legitimacy, drift) {
  return {
    runtime_receipt: true,
    engine,
    boundary,
    authority,
    legitimacy,
    drift,
    version: "v2.0"
  };
}
