const ledger = [];

export function recordRuntime(entry) {
  ledger.push(entry);
}

export function getRuntimeLedger() {
  return ledger;
}
