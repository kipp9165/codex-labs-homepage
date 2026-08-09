import { sanitizeInput } from "../../middleware/sanitizeInput";

export default function handler(req, res) {
  sanitizeInput(req, res, () => {
    res.status(200).json({ echo: req.body });
  });
}
