import { resilienceTest } from "../../resilience/testHarness";

export default function handler(req, res) {
  const result = resilienceTest();
  res.status(200).json({
    version: "v2.0",
    resilience: result
  });
}
