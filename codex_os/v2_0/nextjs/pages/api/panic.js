import { triggerPanic, checkPanic } from "../../resilience/panic";

export default function handler(req, res) {
  const activated = triggerPanic();
  const status = checkPanic();
  res.status(200).json({
    activated,
    status
  });
}
