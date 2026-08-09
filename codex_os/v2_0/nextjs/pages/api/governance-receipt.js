import { governanceRules } from "../../governance/governanceRules";
import { authorityGradient } from "../../governance/authorityGradient";
import { legitimacyScore } from "../../governance/legitimacyScore";
import { governanceReceipt } from "../../governance/governanceReceipt";

export default function handler(req, res) {
  const entity = req.body || {};

  const rules = governanceRules(entity);
  const authority = authorityGradient(entity);
  const legitimacy = legitimacyScore(entity);

  const receipt = governanceReceipt(rules, authority, legitimacy);

  res.status(200).json(receipt);
}
