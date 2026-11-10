import type { PoolClient } from 'pg';
import { fail } from './import.validation';

// Call while holding the account-provisioning advisory lock. Reading the
// current maximum does not reserve numbers or change data during preview.
export async function assignEnterpriseCodes(client: PoolClient, rows: { code: string }[]) {
  if (rows.every(row => row.code)) return;
  const result = await client.query(`SELECT COALESCE(max(reserved.number),0)::text AS value FROM (
    SELECT substring("EnterpriseCode" from 3)::numeric AS number FROM "Enterprises"
      WHERE "EnterpriseCode" ~* '^DN[0-9]+$'
    UNION ALL
    SELECT substring("Username" from 14)::numeric AS number FROM "Users"
      WHERE "Username" ~* '^enterprise_dn[0-9]+$'
  ) reserved`);
  let number = BigInt(result.rows[0].value);
  const reserved = new Set(rows.filter(row => row.code).map(row => row.code.toUpperCase()));
  for (const row of rows) {
    if (row.code) continue;
    let code: string;
    do {
      number++;
      code = 'DN' + number.toString().padStart(6, '0');
      if (code.length > 20) throw fail('Không thể cấp thêm mã doanh nghiệp.', 503, 'ENTERPRISE_CODE_EXHAUSTED');
    } while (reserved.has(code));
    row.code = code;
    reserved.add(code);
  }
}
