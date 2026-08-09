import { fallbackResponse } from "../../reliability/fallback";

export default function handler(req, res) {
  const body = req.body || {};
  const fallback = fallbackResponse("/api/fallback", body);
  res.status(200).json(fallback);
}
