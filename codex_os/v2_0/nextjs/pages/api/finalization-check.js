import { finalizationTest } from "../../finalization/testHarness";

export default function handler(req, res) {
  const result = finalizationTest();
  res.status(200).json({
    version: "v2.0",
    finalization: result
  });
}
