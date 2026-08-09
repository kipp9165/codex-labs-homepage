import { governanceTest } from "../../governance/testHarness";

export default function handler(req, res) {
  const result = governanceTest();
  res.status(200).json({
    version: "v2.0",
    governance: result
  });
}
