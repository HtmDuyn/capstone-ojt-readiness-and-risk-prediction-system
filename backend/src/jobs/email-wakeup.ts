// Keep producers independent of the SMTP worker and its service dependencies.
let wake: (() => void) | undefined;
export function scheduleAccountEmailDelivery() { wake?.(); }
export function wakeEmailAfterCommit<T>(result: T): T { scheduleAccountEmailDelivery(); return result; }
export function registerEmailWakeup(callback: () => void) {
  wake = callback;
  return () => { if (wake === callback) wake = undefined; };
}
