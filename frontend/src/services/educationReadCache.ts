// Short-lived, memory-only cache. Never persist student data or tokens to storage.
const TTL_MS = 60_000;
const MAX_ENTRIES = 1000;
interface Entry { expiresAt: number; value: Promise<unknown> }
const entries = new Map<string, Entry>();
let session: string | null | undefined;

export function clearEducationReadCache() {
  entries.clear();
}

export function educationRead<T>(key: string, load: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  signal?.throwIfAborted();
  const token = localStorage.getItem('ojt_auth_token');
  if (session !== token) { entries.clear(); session = token; }
  let entry = entries.get(key);
  if (entry && entry.expiresAt <= Date.now()) { entries.delete(key); entry = undefined; }
  if (!entry) {
    if (entries.size >= MAX_ENTRIES) entries.delete(entries.keys().next().value!);
    const created: Entry = { expiresAt: Infinity, value: Promise.resolve().then(load) };
    created.value = created.value.then(value => {
      created.expiresAt = Date.now() + TTL_MS;
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
