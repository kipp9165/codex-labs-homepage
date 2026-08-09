import { runtimeEngine } from "../../runtime/runtimeEngine";
import { runtimeBoundary } from "../../runtime/runtimeBoundary";
import { runtimeAuthority } from "../../runtime/runtimeAuthority";
import { runtimeLegitimacy } from "../../runtime/runtimeLegitimacy";
import { runtimeDrift } from "../../runtime/runtimeDrift";
import { runtimeReceipt } from "../../runtime/runtimeReceipt";

export default function handler(req, res) {
  const entity = req.body?.entity || {};
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};

  const engine = runtimeEngine(entity);
  const boundary = runtimeBoundary(entity);
  const authority = runtimeAuthority(entity);
  const legitimacy = runtimeLegitimacy(entity);
  const drift = runtimeDrift(prev, next);

  const receipt = runtimeReceipt(engine, boundary, authority, legitimacy, drift);

  res.status(200).json(receipt);
}
