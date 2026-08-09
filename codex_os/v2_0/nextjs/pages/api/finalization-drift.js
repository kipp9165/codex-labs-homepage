import { finalizationDrift } from "../../finalization/finalizationDrift";

export default function handler(req, res) {
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};
  const drift = finalizationDrift(prev, next);

  res.status(200).json({
    drift
  });
}
