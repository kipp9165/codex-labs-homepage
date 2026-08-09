import { securityHeaders } from "../../middleware/securityHeaders";

export default function handler(req, res) {
  securityHeaders(req, res, () => {});
  res.status(200).json({ status: "ok", version: "v2.0" });
}
