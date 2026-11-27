// Apply only the recruitment policy block; never run the full database reset script.
const fs = require('node:fs');
const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '../.env'), quiet: true });
const { pool } = require('../dist/config/database');
async function main() {
  if (!pool) throw new Error('Database is not configured.');
  const source = fs.readFileSync(path.join(__dirname, '../../db/backend'), 'utf8');
  const start = '-- BEGIN RECRUITMENT MULTI ROUND V1';
  const end = '-- END RECRUITMENT MULTI ROUND V1';
  if (source.split(start).length !== 2 || source.split(end).length !== 2) throw new Error('Expected one recruitment policy block.');
  const block = source.split(start)[1].split(end)[0];
  const checked = block
    .replace('DROP INDEX IF EXISTS public."UQ_RecruitmentWindows_OpenPeriod";', '')
    .replace('DROP TRIGGER IF EXISTS "TR_RecruitmentRound" ON public."RecruitmentWindows";', '')
    .replace('DROP FUNCTION IF EXISTS public."GuardRecruitmentRound"();', '');
  if (!block.trim() || /\b(DROP|DELETE|TRUNCATE)\b/i.test(checked)) throw new Error('Invalid recruitment policy block.');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query("SET LOCAL lock_timeout = '5s'");
    await client.query("SET LOCAL statement_timeout = '30s'");
    await client.query(block);
    await client.query('COMMIT');
    console.log('Recruitment validation is handled by the backend; round trigger removed, existing data preserved.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
}
main().catch(error => {
  // Provider messages can include credentials; log only the error code.
  console.error('Recruitment policy migration failed:', error.code || 'MIGRATION_FAILED');
  process.exitCode = 1;
}).finally(() => pool?.end());
