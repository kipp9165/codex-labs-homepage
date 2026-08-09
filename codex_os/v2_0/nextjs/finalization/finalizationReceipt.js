export function finalizationReceipt(engine, boundary, authority, legitimacy, drift) {
  return {
    finalization_receipt: true,
    engine,
    boundary,
    authority,
    legitimacy,
    drift,
    version: "v2.0"
  };
}
