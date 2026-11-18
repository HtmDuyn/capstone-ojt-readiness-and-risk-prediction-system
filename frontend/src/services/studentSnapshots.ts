interface SnapshotStorage {
  read(): string | null;
  write(value: string): void;
  clear(): void;
}

// Recent UI snapshots only; every mount still revalidates with the server.
export function createStudentSnapshots({ ttlMs = 5 * 60_000, maxEntries = 24, now = Date.now } = {}) {
  const entries = new Map<string, { data: unknown; expiresAt: number }>();
  let storage: SnapshotStorage | undefined;
  let scope: string | null | undefined;
  let generation = 0;
  const clearStorage = () => { try { storage?.clear(); } catch { /* Memory remains usable when storage is disabled. */ } };
  const persist = () => {
    try {
      storage?.write(JSON.stringify({ version: 1, entries: [...entries].map(([key, entry]) => ({ key, ...entry })) }));
    } catch { /* Storage quota/private mode must not prevent rendering or API reads. */ }
  };
  return {
    scope(value: string | null) {
      if (scope !== value) {
        clearStorage();
        storage = undefined;
        scope = value;
        entries.clear();
        generation++;
      }
      return generation;
    },
    invalidate() { entries.clear(); generation++; clearStorage(); },
    restore(ticket: number, nextStorage: SnapshotStorage) {
      if (ticket !== generation || storage) return;
      storage = nextStorage;
      try {
        const saved = JSON.parse(storage.read() ?? 'null');
        if (saved?.version !== 1 || !Array.isArray(saved.entries)) return;
        for (const entry of saved.entries.slice(-maxEntries)) {
          if (typeof entry?.key !== 'string' || !Number.isFinite(entry.expiresAt) ||
            entry.expiresAt <= now() || entry.expiresAt > now() + ttlMs ||
            !Object.prototype.hasOwnProperty.call(entry, 'data') || entries.has(entry.key)) continue;
          entries.set(entry.key, { data: entry.data, expiresAt: entry.expiresAt });
        }
        while (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
      } catch { clearStorage(); }
    },
    read<T>(ticket: number, key: string): { data: T } | undefined {
      if (ticket !== generation) return;
      const entry = entries.get(key);
      if (!entry) return;
      if (entry.expiresAt <= now()) { entries.delete(key); return; }
      return { data: entry.data as T };
    },
    write<T>(ticket: number, key: string, data: T) {
      // A request begun before a mutation/logout must never refill the cache.
      if (ticket !== generation) return;
      entries.delete(key);
      entries.set(key, { data, expiresAt: now() + ttlMs });
      while (entries.size > maxEntries) entries.delete(entries.keys().next().value!);
      persist();
    },
  };
}
export const studentSnapshots = createStudentSnapshots();

let initialization: { token: string; ticket: number; ready: Promise<void> } | undefined;
export function initializeStudentSnapshots(token: string | null): Promise<void> {
  const ticket = studentSnapshots.scope(token);
  if (!token || typeof window === 'undefined' || !globalThis.crypto?.subtle) return Promise.resolve();
  if (initialization?.token === token && initialization.ticket === ticket) return initialization.ready;
  const ready = (async () => {
    // The raw bearer token is never written into cache keys or payloads.
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(token));
    const key = 'ojt:student-ui:v1:' + [...new Uint8Array(digest)].map(byte => byte.toString(16).padStart(2, '0')).join('');
    const tabStorage = window.sessionStorage;
    if (!tabStorage) return;
    studentSnapshots.restore(ticket, {
      read: () => tabStorage.getItem(key),
      write: value => tabStorage.setItem(key, value),
      clear: () => tabStorage.removeItem(key),
    });
  })().catch(() => { /* Fall back to memory-only snapshots. */ });
  initialization = { token, ticket, ready };
  return ready;
}
