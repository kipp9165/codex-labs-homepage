import { memoize } from "../../performance/memoize";

export default function handler(req, res) {
  const body = req.body || {};
  const result = memoize("/api/memo", body, () => ({
    memoized: true,
    body
  }));

  res.status(200).json(result);
}
