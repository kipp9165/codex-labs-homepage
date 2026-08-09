import { checkDependencies } from "../../reliability/healthDependencies";
import { serviceGuard } from "../../reliability/serviceGuard";

export default function handler(req, res) {
  const deps = checkDependencies();
  const guard = serviceGuard(true);

  res.status(200).json({
    version: "v2.0",
    dependencies: deps,
    guard
  });
}
