import { constitutionalTest } from "../../constitutional/testHarness";

export default function handler(req, res) {
  const result = constitutionalTest();
  res.status(200).json({
    version: "v2.0",
    constitutional: result
  });
}
