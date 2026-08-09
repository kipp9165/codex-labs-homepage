import { intelligenceTest } from "../../intelligence/testHarness";

export default function handler(req, res) {
  const result = intelligenceTest();
  res.status(200).json({
    version: "v2.0",
    intelligence: result
  });
}
