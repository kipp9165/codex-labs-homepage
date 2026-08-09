import { constitutionalDrift } from "../../constitutional/constitutionalDrift";

export default function handler(req, res) {
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};
  const drift = constitutionalDrift(prev, next);

  res.status(200).json({
    drift
  });
}
