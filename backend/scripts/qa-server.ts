import '../src/config/env';
import { configureQaReadOnly } from './qa-readonly';
// This entrypoint deliberately does not import server.ts or start background workers.
process.env.PGOPTIONS = '-c default_transaction_read_only=on -c statement_timeout=20000';
process.env.DB_CONNECTION_TIMEOUT_MS = '10000';
process.env.ENTERPRISE_RECRUITMENT_WORKER_ENABLED = 'false';
async function main() {
  const { default: app } = await import('../src/app');
  const { pool } = await import('../src/config/database');
  configureQaReadOnly(pool);
  if (!pool) throw Error('QA_DATABASE_NOT_CONFIGURED');
  const result = await pool.query('SHOW default_transaction_read_only');
  if (result.rows[0].default_transaction_read_only !== 'on') throw Error('QA_READ_ONLY_REQUIRED');
  const server = app.listen(Number(process.env.QA_API_PORT || 3300), '127.0.0.1');
  const stop = () => server.close(() => { void pool.end().then(() => process.exit(0)); });
  process.on('SIGTERM', stop); process.on('SIGINT', stop);
}
main().catch((error) => { console.error('QA server could not start:', /^[A-Z_]+$/.test(error.message) ? error.message : 'DATABASE_OR_STARTUP_ERROR'); process.exit(1); });
