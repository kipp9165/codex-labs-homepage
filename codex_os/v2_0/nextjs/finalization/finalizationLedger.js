const ledger = [];

export function recordFinalization(entry) {
  ledger.push(entry);
}

export function getFinalizationLedger() {
  return ledger;
}
