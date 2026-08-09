import { verifySignature } from "../../middleware/verifySignature";
import { replayGuard } from "../../middleware/replayGuard";
import { sanitizeInput } from "../../middleware/sanitizeInput";

export default function handler(req, res) {
  verifySignature(req, res, () => {
    replayGuard(req, res, () => {
      sanitizeInput(req, res, () => {
        res.status(200).json({ verified: true });
      });
    });
  });
}
