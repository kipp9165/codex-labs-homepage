import { executionDrift } from "../../execution/executionDrift";

export default function handler(req, res) {
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};
  const drift = executionDrift(prev, next);

  res.status(200).json({
    drift
  });
}
