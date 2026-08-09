import { finalizationEngine } from "../../finalization/finalizationEngine";
import { finalizationBoundary } from "../../finalization/finalizationBoundary";
import { finalizationAuthority } from "../../finalization/finalizationAuthority";
import { finalizationLegitimacy } from "../../finalization/finalizationLegitimacy";
import { finalizationDrift } from "../../finalization/finalizationDrift";
import { finalizationReceipt } from "../../finalization/finalizationReceipt";

export default function handler(req, res) {
  const entity = req.body?.entity || {};
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};

  const engine = finalizationEngine(entity);
  const boundary = finalizationBoundary(entity);
  const authority = finalizationAuthority(entity);
  const legitimacy = finalizationLegitimacy(entity);
  const drift = finalizationDrift(prev, next);

  const receipt = finalizationReceipt(engine, boundary, authority, legitimacy, drift);

  res.status(200).json(receipt);
}
