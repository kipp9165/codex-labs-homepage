export function continuityReceipt(delta, drift) {
  return {
    continuity_receipt: true,
    delta,
    drift,
    version: "v2.0"
  };
}
