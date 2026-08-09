import { performanceTest } from "../../performance/testHarness";

export default function handler(req, res) {
  const result = performanceTest();
  res.status(200).json({
    version: "v2.0",
    performance: result
  });
}
