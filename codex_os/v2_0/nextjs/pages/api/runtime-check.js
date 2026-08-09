import { runtimeTest } from "../../runtime/testHarness";

export default function handler(req, res) {
  const result = runtimeTest();
  res.status(200).json({
    version: "v2.0",
    runtime: result
  });
}
