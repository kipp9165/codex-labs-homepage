import { degrade } from "../../resilience/degradation";

export default function handler(req, res) {
  const body = req.body || {};
  const result = degrade("/api/degrade", body);
  res.status(200).json(result);
}
