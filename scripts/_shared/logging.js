import { timestampIso } from "./time_utils.js";

function emit(level, job, message, context = {}) {
  const record = {
    ts: timestampIso(),
    level,
    job,
    message,
    ...context,
  };
  console.log(JSON.stringify(record));
}

export function createLogger(job) {
  return {
    info(message, context = {}) {
      emit("info", job, message, context);
    },
    warn(message, context = {}) {
      emit("warn", job, message, context);
    },
    error(message, context = {}) {
      emit("error", job, message, context);
    },
    summary(payload) {
      console.log(JSON.stringify(payload, null, 2));
    },
  };
}
