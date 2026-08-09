import { runtimeDrift } from "../../runtime/runtimeDrift";

export default function handler(req, res) {
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};
  const drift = runtimeDrift(prev, next);

  res.status(200).json({
    drift
  });
}
