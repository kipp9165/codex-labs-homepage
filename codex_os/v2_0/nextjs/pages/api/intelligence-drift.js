import { intelligenceDrift } from "../../intelligence/intelligenceDrift";

export default function handler(req, res) {
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};
  const drift = intelligenceDrift(prev, next);

  res.status(200).json({
    drift
  });
}
