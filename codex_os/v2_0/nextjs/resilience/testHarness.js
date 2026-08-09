import { degrade } from "./degradation";
import { triggerPanic, checkPanic } from "./panic";
import { initiateShutdown, shutdownStatus } from "./gracefulShutdown";
import { selfHeal } from "./selfHeal";
import { redundancy } from "./redundancy";

export function resilienceTest() {
  const d = degrade("/test", { test: true });
  const p = triggerPanic();
  const pcheck = checkPanic();
  const s = initiateShutdown();
  const scheck = shutdownStatus();
  const heal = selfHeal();
  const r = redundancy("/test", { test: true });

  return {
    degradation: d,
    panic: p,
    panicCheck: pcheck,
    shutdown: s,
    shutdownCheck: scheck,
    selfHeal: heal,
    redundancy: r
  };
}
