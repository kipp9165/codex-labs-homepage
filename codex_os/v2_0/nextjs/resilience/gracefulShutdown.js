let shuttingDown = false;

export function initiateShutdown() {
  shuttingDown = true;
  return { shutdown: true, message: "Graceful shutdown initiated" };
}

export function shutdownStatus() {
  return { shutdown: shuttingDown };
}
