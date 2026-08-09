import { continuityTest } from "../../continuity/testHarness";

export default function handler(req, res) {
  const result = continuityTest();
  res.status(200).json({
    version: "v2.0",
    continuity: result
  });
}
