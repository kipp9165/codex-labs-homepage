import { continuityDelta } from "../../continuity/continuityDelta";
import { detectDrift } from "../../continuity/driftDetector";
import { continuityReceipt } from "../../continuity/continuityReceipt";

export default function handler(req, res) {
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};

  const delta = continuityDelta(prev, next);
  const drift = detectDrift(prev, next);
  const receipt = continuityReceipt(delta, drift);

  res.status(200).json(receipt);
}
