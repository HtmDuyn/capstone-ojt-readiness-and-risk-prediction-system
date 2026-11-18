interface PendingRead {
  controller: AbortController;
  promise: Promise<unknown>;
  readers: number;
  settled: boolean;
}

// Share only requests still in flight. Completed responses are never cached.
// Each screen owns its cancellation; the HTTP request stops when its last reader leaves.
export function createStudentReads() {
  const pending = new Map<string, PendingRead>();
  const active = new Set<PendingRead>();
  let currentScope: string | null | undefined;
  return {
    invalidate() { pending.clear(); },
    read<T>(scope: string | null, key: string, load: (signal: AbortSignal) => Promise<T>, signal?: AbortSignal): Promise<T> {
      signal?.throwIfAborted();
      if (scope !== currentScope) {
        for (const entry of active) entry.controller.abort();
        pending.clear();
        currentScope = scope;
      }
      let entry = pending.get(key);
      if (!entry) {
        const controller = new AbortController();
        const created: PendingRead = { controller, readers: 0, settled: false, promise: Promise.resolve() };
        created.promise = Promise.resolve().then(() => {
          controller.signal.throwIfAborted();
          return load(controller.signal);
        }).finally(() => {
          created.settled = true;
          active.delete(created);
          if (pending.get(key) === created) pending.delete(key);
        });
        pending.set(key, created);
        active.add(created);
        entry = created;
      }
      const shared = entry;
      shared.readers++;
      return new Promise<T>((resolve, reject) => {
        let finished = false;
        const finish = (callback: () => void) => {
          if (finished) return;
          finished = true;
          signal?.removeEventListener('abort', abort);
          shared.controller.signal.removeEventListener('abort', sharedAbort);
          shared.readers--;
          if (!shared.readers && !shared.settled) {
            if (pending.get(key) === shared) pending.delete(key);
            shared.controller.abort();
          }
          callback();
        };
        const abort = () => finish(() => reject(signal?.reason ?? new DOMException('Aborted', 'AbortError')));
        const sharedAbort = () => finish(() => reject(new DOMException('Aborted', 'AbortError')));
        signal?.addEventListener('abort', abort, { once: true });
        shared.controller.signal.addEventListener('abort', sharedAbort, { once: true });
        shared.promise.then(value => finish(() => resolve(value as T)), error => finish(() => reject(error)));
      });
    },
  };
}

export const studentReads = createStudentReads();
