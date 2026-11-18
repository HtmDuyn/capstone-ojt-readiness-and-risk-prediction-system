import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid } from '../students/student.validation';

export async function listCreditThresholds() {
  return academicTransaction(async client => {
    const { rows } = await client.query('SELECT "ThresholdID" AS id, "MinCredits"::float8 AS "minCredits" FROM "OJTCreditThresholds" ORDER BY "MinCredits"');
    return rows;
  });
}

export async function createCreditThreshold(body: unknown, actor: number) {
  const { minCredits } = inputObject(body, ['minCredits']);
  if (typeof minCredits !== 'number' || !Number.isFinite(minCredits) || minCredits < 0 ||
      minCredits > 9999.99 || Math.abs(minCredits * 100 - Math.round(minCredits * 100)) > 1e-8) {
    throw invalid('Tín chỉ tối thiểu phải từ 0 đến 9999,99 và có tối đa hai chữ số thập phân.');
  }
  return academicTransaction(async client => {
    const { rows: [created] } = await client.query(
      `INSERT INTO "OJTCreditThresholds" ("MinCredits","CreatedBy") VALUES ($1,$2)
       ON CONFLICT ("MinCredits") DO NOTHING
       RETURNING "ThresholdID" AS id, "MinCredits"::float8 AS "minCredits"`, [minCredits, actor]);
    if (!created) throw invalid('Mức tín chỉ này đã tồn tại.',409,'OJT_THRESHOLD_EXISTS');
    await audit(client, actor, 'OJTCreditThresholds', created.id, 'CREATE', null, created);
    return created;
  });
}
