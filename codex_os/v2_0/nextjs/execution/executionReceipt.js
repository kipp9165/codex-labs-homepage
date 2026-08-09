export function executionReceipt(engine, boundary, authority, legitimacy, drift) {
  return {
    execution_receipt: true,
    engine,
    boundary,
    authority,
    legitimacy,
    drift,
    version: "v2.0"
  };
}
