import { verifySignature } from "../../middleware/verifySignature";
import { replayGuard } from "../../middleware/replayGuard";

export default function handler(req, res) {
  verifySignature(req, res, () => {
    replayGuard(req, res, () => {
      res.status(200).json({
        receipt: {
          version: "v2.0",
          timestamp: Date.now(),
          status: "valid"
        }
      });
    });
  });
}
