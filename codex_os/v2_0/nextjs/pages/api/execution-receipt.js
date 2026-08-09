import { executionEngine } from "../../execution/executionEngine";
import { executionBoundary } from "../../execution/executionBoundary";
import { executionAuthority } from "../../execution/executionAuthority";
import { executionLegitimacy } from "../../execution/executionLegitimacy";
import { executionDrift } from "../../execution/executionDrift";
import { executionReceipt } from "../../execution/executionReceipt";

export default function handler(req, res) {
  const entity = req.body?.entity || {};
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};

  const engine = executionEngine(entity);
  const boundary = executionBoundary(entity);
  const authority = executionAuthority(entity);
  const legitimacy = executionLegitimacy(entity);
  const drift = executionDrift(prev, next);

  const receipt = executionReceipt(engine, boundary, authority, legitimacy, drift);

  res.status(200).json(receipt);
}
