import { intelligenceEngine } from "../../intelligence/intelligenceEngine";
import { intelligenceSurface } from "../../intelligence/intelligenceSurface";
import { intelligenceGradient } from "../../intelligence/intelligenceGradient";
import { intelligenceCoherence } from "../../intelligence/intelligenceCoherence";
import { intelligenceDrift } from "../../intelligence/intelligenceDrift";
import { intelligenceReceipt } from "../../intelligence/intelligenceReceipt";

export default function handler(req, res) {
  const entity = req.body?.entity || {};
  const prev = req.body?.prev || {};
  const next = req.body?.next || {};

  const engine = intelligenceEngine(entity);
  const surface = intelligenceSurface(entity);
  const gradient = intelligenceGradient(entity);
  const coherence = intelligenceCoherence(entity);
  const drift = intelligenceDrift(prev, next);

  const receipt = intelligenceReceipt(engine, surface, gradient, coherence, drift);

  res.status(200).json(receipt);
}
