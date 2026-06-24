export function timestampIso() {
  return new Date().toISOString();
}

export function fileTimestamp() {
  return timestampIso().replace(/[:.]/g, "-");
}

export function isoDateFromUnix(unixSeconds) {
  if (typeof unixSeconds !== "number") {
    return "";
  }
  return new Date(unixSeconds * 1000).toISOString().slice(0, 10);
}

export function unixNow() {
  return Math.floor(Date.now() / 1000);
}

export function unixDaysAgo(days) {
  return unixNow() - days * 24 * 60 * 60;
}
