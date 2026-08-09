const ledger = [];

export function recordGovernance(entry) {
  ledger.push(entry);
}

export function getGovernanceLedger() {
  return ledger;
}
