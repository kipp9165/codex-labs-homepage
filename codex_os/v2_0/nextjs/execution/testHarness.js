import { executionEngine } from "./executionEngine";
import { executionBoundary } from "./executionBoundary";
import { executionAuthority } from "./executionAuthority";
import { executionLegitimacy } from "./executionLegitimacy";
import { executionDrift } from "./executionDrift";
import { recordExecution, getExecutionLedger } from "./executionLedger";
import { executionReceipt } from "./executionReceipt";

export function executionTest() {
  const prev = { a: 1, b: 2, c: 3 };
  const next = { a: 1, b: 11, c: 3 };

  const entity = { authority: 9, domain: "execution", scope: "system" };

  const engine = executionEngine(entity);
  const boundary = executionBoundary(entity);
  const authority = executionAuthority(entity);
  const legitimacy = executionLegitimacy(entity);
  const drift = executionDrift(prev, next);

  const receipt = executionReceipt(engine, boundary, authority, legitimacy, drift);

  recordExecution(receipt);

  return {
    engine,
    boundary,
    authority,
    legitimacy,
    drift,
    receipt,
    ledger: getExecutionLedger()
  };
}
