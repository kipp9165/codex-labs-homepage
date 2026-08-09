import { legitimacyScore } from "../../governance/legitimacyScore";

export default function handler(req, res) {
  const entity = req.body || {};
  const result = legitimacyScore(entity);
  res.status(200).json(result);
}
