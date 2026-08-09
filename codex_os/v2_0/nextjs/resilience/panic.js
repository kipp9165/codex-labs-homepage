let panicState = false;

export function triggerPanic() {
  panicState = true;
  return { panic: true, message: "Panic mode activated" };
}

export function checkPanic() {
  return { panic: panicState };
}
