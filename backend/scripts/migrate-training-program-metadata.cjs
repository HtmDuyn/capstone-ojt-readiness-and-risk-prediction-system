// Execute only the additive section, never the reset/seed portions of backend/DB.
require('dotenv').config({ path: require('node:path').join(__dirname, '../.env') });
const fs = require('node:fs');
const path = require('node:path');
const { pool } = require('../dist/config/database');

(async () => {
  if (!pool) throw new Error('Configure the backend database connection.');
  const schema = fs.readFileSync(path.join(__dirname, '../DB'), 'utf8');
  const marker = '-- SECTION: 20261024 training program metadata compatibility';
  const offset = schema.indexOf(marker);
  if (offset < 0 || schema.indexOf(marker, offset + marker.length) >= 0) throw new Error('Expected exactly one training program metadata section in backend/DB.');
  const end = schema.indexOf('-- SECTION:', offset + marker.length);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(schema.slice(offset, end < 0 ? undefined : end));
    await client.query('COMMIT');
    console.log('TrainingPrograms metadata migration installed (10 columns; no new application tables).');
    console.log('Existing values preserved; newly added status/review fields default to DRAFT/false.');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally { client.release(); }
})().catch(error => {
  console.error('Training program metadata migration failed:', error.message);
  process.exitCode = 1;
}).finally(() => pool?.end());
