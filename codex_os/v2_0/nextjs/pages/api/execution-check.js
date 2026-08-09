import { executionTest } from "../../execution/testHarness";

export default function handler(req, res) {
  const result = executionTest();
  res.status(200).json({
    version: "v2.0",
    execution: result
  });
}
