// Short-lived UI snapshots only. Every mount still revalidates with the server.
// Nothing is persisted; session changes and successful writes invalidate all entries.
export function createStudentSnapshots({ ttlMs = 60_000, maxEntries = 24, now = Date.now } = {}) {
  const entries = new Map<string, { data: unknown; expiresAt: number }>();
  let scope: string | null | undefined;
  let generation = 0;
  return {
    scope(value: string | null) {
      if (scope !== value) {
        scope = value;
        entries.clear();
        generation++;
      }
      return generation;
    },
    invalidate() { entries.clear(); generation++; },
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
    },
  };
}
export const studentSnapshots = createStudentSnapshots();
