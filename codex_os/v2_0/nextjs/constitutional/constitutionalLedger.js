const ledger = [];

export function recordConstitutional(entry) {
  ledger.push(entry);
}

export function getConstitutionalLedger() {
  return ledger;
}
