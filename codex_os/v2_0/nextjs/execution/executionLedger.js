const ledger = [];

export function recordExecution(entry) {
  ledger.push(entry);
}

export function getExecutionLedger() {
  return ledger;
}
