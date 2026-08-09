import { memoize } from "../../performance/memoize";

export default function handler(req, res) {
  const body = req.body || {};
  const result = memoize("/api/cache", body, () => ({
    cached: true,
    body
  }));

  res.status(200).json(result);
}
