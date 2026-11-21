import type { Pool, PoolClient } from 'pg';

// Supabase's session pooler can ignore libpq startup options. Configure each
// acquired physical session before pg-pool makes it available to application code.
export function configureQaReadOnly(pool: Pool | null) {
  if (!pool) return;
  (pool.options as any).onConnect = async (client: PoolClient) => {
    await client.query('SET default_transaction_read_only = on');
    await client.query("SET statement_timeout = '20s'");
    const result = await client.query('SHOW default_transaction_read_only');
    if (result.rows[0].default_transaction_read_only !== 'on') throw Error('QA_READ_ONLY_REQUIRED');
  };
}
