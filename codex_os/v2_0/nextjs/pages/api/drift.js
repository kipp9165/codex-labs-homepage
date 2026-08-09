import { detectDrift } from "../../continuity/driftDetector";

export default function handler(req, res) {
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};
  const drift = detectDrift(prev, next);

  res.status(200).json({
    drift
  });
}
