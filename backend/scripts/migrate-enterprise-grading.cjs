// Default: validate the additive migration and roll it back. --apply commits it.
const fs = require('node:fs');
const path = require('node:path');
const { Client } = require('pg');
require('dotenv').config({ path: path.resolve(__dirname, '../.env'), quiet: true });
const { databaseConfig, pool } = require('../dist/config/database');

async function main() {
  if (process.argv.slice(2).some(arg => arg !== '--apply')) throw new Error('Usage: node scripts/migrate-enterprise-grading.cjs [--apply]');
  const apply = process.argv.includes('--apply');
  const client = new Client({ connectionString: databaseConfig.url, ssl: databaseConfig.ssl, connectionTimeoutMillis: 5000 });
  let transaction = false;
  try {
    await client.connect();
    await client.query('BEGIN'); transaction = true;
    await client.query("SET LOCAL lock_timeout='5s'");
    await client.query("SET LOCAL statement_timeout='30s'");
    await client.query("SELECT pg_advisory_xact_lock(hashtext('academic-calendar'))");
    await client.query(fs.readFileSync(path.resolve(__dirname, '../migrations/20261124_enterprise_grading_criteria.sql'), 'utf8'));
    await client.query(apply ? 'COMMIT' : 'ROLLBACK'); transaction = false;
    console.log(apply ? 'Grading metadata migration applied; existing policies and scores preserved.' : 'Grading metadata migration validated and rolled back. Use --apply to commit.');
  } finally {
    if (transaction) await client.query('ROLLBACK').catch(() => {});
    await client.end();
    await pool?.end();
  }
}
main().catch(error => {
  console.error('Grading migration failed:', error.code ?? error.name);
  process.exitCode = 1;
});
