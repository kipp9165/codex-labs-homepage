const ledger = [];

export function recordContinuity(entry) {
  ledger.push(entry);
}

export function getContinuityLedger() {
  return ledger;
}
