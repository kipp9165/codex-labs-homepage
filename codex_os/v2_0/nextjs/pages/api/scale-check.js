import { scalabilityTest } from "../../scalability/testHarness";

export default async function handler(req, res) {
  const result = await scalabilityTest();
  res.status(200).json({
    version: "v2.0",
    scalability: result
  });
}
