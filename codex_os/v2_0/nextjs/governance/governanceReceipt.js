export function governanceReceipt(rules, authority, legitimacy) {
  return {
    governance_receipt: true,
    rules,
    authority,
    legitimacy,
    version: "v2.0"
  };
}
