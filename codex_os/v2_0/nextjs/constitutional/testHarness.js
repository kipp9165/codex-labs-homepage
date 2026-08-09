import { constitutionalEngine } from "./constitutionalEngine";
import { constitutionalSurface } from "./constitutionalSurface";
import { authorityConstitutional } from "./authorityConstitutional";
import { legitimacyHorizon } from "./legitimacyHorizon";
import { constitutionalDrift } from "./constitutionalDrift";
import { recordConstitutional, getConstitutionalLedger } from "./constitutionalLedger";
import { constitutionalReceipt } from "./constitutionalReceipt";

export function constitutionalTest() {
  const prev = { a: 1, b: 2, c: 3 };
  const next = { a: 1, b: 5, c: 3 };

  const entity = { level: 4, domain: "constitutional", scope: "system" };

  const engine = constitutionalEngine(entity);
  const surface = constitutionalSurface(entity);
  const authority = authorityConstitutional(entity);
  const horizon = legitimacyHorizon(entity);
  const drift = constitutionalDrift(prev, next);

  const receipt = constitutionalReceipt(engine, surface, authority, horizon, drift);

  recordConstitutional(receipt);

  return {
    engine,
    surface,
    authority,
    horizon,
    drift,
    receipt,
    ledger: getConstitutionalLedger()
  };
}
