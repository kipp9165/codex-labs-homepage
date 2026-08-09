import { runtimeEngine } from "./runtimeEngine";
import { runtimeBoundary } from "./runtimeBoundary";
import { runtimeAuthority } from "./runtimeAuthority";
import { runtimeLegitimacy } from "./runtimeLegitimacy";
import { runtimeDrift } from "./runtimeDrift";
import { recordRuntime, getRuntimeLedger } from "./runtimeLedger";
import { runtimeReceipt } from "./runtimeReceipt";

export function runtimeTest() {
  const prev = { a: 1, b: 2, c: 3 };
  const next = { a: 1, b: 9, c: 3 };

  const entity = { authority: 7, domain: "runtime", scope: "system" };

  const engine = runtimeEngine(entity);
  const boundary = runtimeBoundary(entity);
  const authority = runtimeAuthority(entity);
  const legitimacy = runtimeLegitimacy(entity);
  const drift = runtimeDrift(prev, next);

  const receipt = runtimeReceipt(engine, boundary, authority, legitimacy, drift);

  recordRuntime(receipt);

  return {
    engine,
    boundary,
    authority,
    legitimacy,
    drift,
    receipt,
    ledger: getRuntimeLedger()
  };
}
