import { config, stripe } from "../config.js";
import { logger } from "./core/logger.js";
import { PresenceLedger } from "./core/presence-ledger.js";
import { UnifiedSafetyRuntime } from "./runtime/unified-safety-runtime.js";
import { createApp } from "./server/create-app.js";

export function startServer() {
  const presenceLedger = new PresenceLedger({ maxEntries: config.presenceLedgerMaxEntries });
  const runtime = new UnifiedSafetyRuntime({ logger });

  const app = createApp({
    config,
    logger,
    presenceLedger,
    runtime,
    stripe,
  });

  const server = app.listen(config.port, () => {
    logger.info("webhook_listening", {
      port: config.port,
      registered_systems: runtime.healthSummary().registered_systems,
    });
  });

  server.on("error", (err) => {
    logger.error("webhook_server_error", {
      code: err.code || "unknown",
      message: err.message,
    });
    process.exit(1);
  });

  return server;
}
