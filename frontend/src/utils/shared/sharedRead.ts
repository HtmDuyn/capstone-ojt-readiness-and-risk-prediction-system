// Share concurrent requests and optionally retain selected reads in memory.
// Entries are scoped to the current bearer token and never reach persistent storage.
const MAX_ENTRIES = 1000;
interface Entry { value: Promise<unknown>; expiresAt: number }
const entries = new Map<string, Entry>();
let session: string | null | undefined;

export function clearSharedReads() {
  entries.clear();
}

export function sharedRead<T>(key: string, load: () => Promise<T>, signal?: AbortSignal, ttlMs = 0): Promise<T> {
  signal?.throwIfAborted();
  const token = localStorage.getItem('ojt_auth_token');
  if (session !== token) { entries.clear(); session = token; }
  let entry = entries.get(key);
  if (entry && entry.expiresAt <= Date.now() && entry.expiresAt !== 0) {
    entries.delete(key);
    entry = undefined;
  }
  if (!entry) {
    if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value!);
    const created: Entry = { value: Promise.resolve().then(load), expiresAt: 0 };
    created.value = created.value.then(value => {
      if (entries.get(key) === created) {
        if (ttlMs > 0) created.expiresAt = Date.now() + ttlMs;
        else entries.delete(key);
      }
      return value;
    }, error => {
      if (entries.get(key) === created) entries.delete(key);
      throw error;
    });
    entries.set(key, created);
    entry = created;
  }
  // Each consumer can cancel its wait without cancelling a request another consumer needs.
  const value = entry.value as Promise<T>;
  if (!signal) return value;
  return new Promise<T>((resolve, reject) => {
    const abort = () => { cleanup(); reject(signal.reason ?? new DOMException('Aborted', 'AbortError')); };
    const cleanup = () => signal.removeEventListener('abort', abort);
    signal.addEventListener('abort', abort, { once: true });
    value.then(result => { cleanup(); resolve(result); }, error => { cleanup(); reject(error); });
  });
}
