import { circuitBreaker } from "../../reliability/circuitBreaker";

export default async function handler(req, res) {
  const failingFn = async () => {
    throw new Error("Simulated circuit failure");
  };

  const result = await circuitBreaker(failingFn);
  res.status(200).json(result);
}
