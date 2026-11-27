// Apply only the additive attachment block; never run the full database reset script.
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { pool } = require('../dist/config/database');
async function main() {
  if (!pool) throw new Error('Database is not configured.');
  const source = fs.readFileSync(path.join(__dirname, '../../db/database'), 'utf8');
  const start = '-- BEGIN TASK SUBMISSION ATTACHMENTS';
  const end = '-- END TASK SUBMISSION ATTACHMENTS';
  if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error('Expected one attachment schema block.');
  const block = source.split(start)[1].split(end)[0];
  if (!block.trim() || /\b(DROP|DELETE|TRUNCATE)\b/i.test(block)) throw new Error('Invalid additive attachment schema block.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query(block);
    await client.query('COMMIT');
    console.log('Task attachment schema is ready; existing data preserved.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
main().catch(error => {
  // Provider messages can include credentials; log only the error code.
  console.error('Task attachment migration failed:', error.code || 'MIGRATION_FAILED');
  process.exitCode = 1;
}).finally(() => pool?.end());
