import { authorityGradient } from "../../governance/authorityGradient";

export default function handler(req, res) {
  const entity = req.body || {};
  const result = authorityGradient(entity);
  res.status(200).json(result);
}
