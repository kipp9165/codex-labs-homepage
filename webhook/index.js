import { startServer } from "./src/server.js";

// Catch unhandled promise rejections so every crash is logged before exit.
process.on("unhandledRejection", (reason) => {
  console.error(
    JSON.stringify({
      level: "error",
      message: "unhandled_rejection",
      reason: reason instanceof Error ? reason.message : String(reason),
      ts: new Date().toISOString(),
    })
  );
  process.exit(1);
});

startServer();
