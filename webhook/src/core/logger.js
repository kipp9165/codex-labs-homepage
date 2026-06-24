import { stableStringify } from "./stable-json.js";

function write(level, message, context = {}) {
  const payload = {
    context,
    level,
    message,
    ts: new Date().toISOString(),
  };

  console.log(stableStringify(payload));
}

export const logger = {
  debug(message, context) {
    write("debug", message, context);
  },
  info(message, context) {
    write("info", message, context);
  },
  warn(message, context) {
    write("warn", message, context);
  },
  error(message, context) {
    write("error", message, context);
  },
};
