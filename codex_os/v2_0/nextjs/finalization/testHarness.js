import { finalizationEngine } from "./finalizationEngine";
import { finalizationBoundary } from "./finalizationBoundary";
import { finalizationAuthority } from "./finalizationAuthority";
import { finalizationLegitimacy } from "./finalizationLegitimacy";
import { finalizationDrift } from "./finalizationDrift";
import { recordFinalization, getFinalizationLedger } from "./finalizationLedger";
import { finalizationReceipt } from "./finalizationReceipt";

export function finalizationTest() {
  const prev = { a: 1, b: 2, c: 3 };
  const next = { a: 1, b: 13, c: 3 };

  const entity = { authority: 10, domain: "finalization", scope: "system" };

  const engine = finalizationEngine(entity);
  const boundary = finalizationBoundary(entity);
  const authority = finalizationAuthority(entity);
  const legitimacy = finalizationLegitimacy(entity);
  const drift = finalizationDrift(prev, next);

  const receipt = finalizationReceipt(engine, boundary, authority, legitimacy, drift);

  recordFinalization(receipt);

  return {
    engine,
    boundary,
    authority,
    legitimacy,
    drift,
    receipt,
    ledger: getFinalizationLedger()
  };
}
