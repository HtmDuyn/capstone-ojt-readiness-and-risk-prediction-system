import type { PoolClient } from 'pg';

// Only reuse SELECTs inside one read-only transaction. Different OJT scopes
// retain their own rules and confirmations; shared source rows are read once.
export function cachedReportReader(client: PoolClient): PoolClient {
  const reads = new Map<string, Promise<any>>();
  const reader = Object.create(client) as PoolClient;
  reader.query = (async (sql: string, params: unknown[] = []) => {
    if (!/^\s*SELECT\b/i.test(sql)) throw new Error('Report cache accepts SELECT queries only.');
    const key = JSON.stringify([sql, params]);
    let pending = reads.get(key);
    if (!pending) {
      pending = client.query(sql, params);
      reads.set(key, pending);
    }
    const result = await pending;
    // Calculations in different scopes must not share mutable source rows.
    return { ...result, rows: structuredClone(result.rows) };
  }) as PoolClient['query'];
  return reader;
}
