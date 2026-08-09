import { governanceRules } from "./governanceRules";
import { authorityGradient } from "./authorityGradient";
import { legitimacyScore } from "./legitimacyScore";
import { recordGovernance, getGovernanceLedger } from "./governanceLedger";
import { governanceReceipt } from "./governanceReceipt";

export function governanceTest() {
  const entity = { level: 3, role: "system", domain: "constitutional" };

  const rules = governanceRules(entity);
  const authority = authorityGradient(entity);
  const legitimacy = legitimacyScore(entity);

  const receipt = governanceReceipt(rules, authority, legitimacy);

  recordGovernance(receipt);

  return {
    rules,
    authority,
    legitimacy,
    receipt,
    ledger: getGovernanceLedger()
  };
}
