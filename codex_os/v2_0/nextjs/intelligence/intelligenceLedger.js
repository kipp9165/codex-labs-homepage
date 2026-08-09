const ledger = [];

export function recordIntelligence(entry) {
  ledger.push(entry);
}

export function getIntelligenceLedger() {
  return ledger;
}
