import { constitutionalEngine } from "../../constitutional/constitutionalEngine";
import { constitutionalSurface } from "../../constitutional/constitutionalSurface";
import { authorityConstitutional } from "../../constitutional/authorityConstitutional";
import { legitimacyHorizon } from "../../constitutional/legitimacyHorizon";
import { constitutionalDrift } from "../../constitutional/constitutionalDrift";
import { constitutionalReceipt } from "../../constitutional/constitutionalReceipt";

export default function handler(req, res) {
  const entity = req.body?.entity || {};
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};

  const engine = constitutionalEngine(entity);
  const surface = constitutionalSurface(entity);
  const authority = authorityConstitutional(entity);
  const horizon = legitimacyHorizon(entity);
  const drift = constitutionalDrift(prev, next);

  const receipt = constitutionalReceipt(engine, surface, authority, horizon, drift);

  res.status(200).json(receipt);
}
