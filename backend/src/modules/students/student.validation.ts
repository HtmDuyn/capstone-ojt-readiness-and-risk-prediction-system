import { academicError, inputObject, positiveId, requiredText } from '../academic/academic.schema';
export { academicError as invalid, inputObject, positiveId, requiredText };
export const resultStatuses = ['PASSED','FAILED','IN_PROGRESS','WITHDRAWN','RECOGNIZED'];
export function enumValue(value: unknown, values: string[], name: string): string {
  if (typeof value !== 'string' || !values.includes(value)) throw academicError(`${name} must be ${values.join(', ')}.`);
  return value;
}
export function optionalText(value: unknown, name: string, max: number) { return value == null ? null : requiredText(value, name, max); }
export function score(value: unknown, max: number, name: string) {
  if (value == null) return null;
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) throw academicError(`${name} must be a number between 0 and ${max}, with at most two decimals.`);
  return value;
}
export function resultValues(body: Record<string, unknown>) {
  const status = enumValue(body.status, resultStatuses, 'status');
  const value = { status, score: score(body.score,10,'score'), gradePoints: score(body.gradePoints,4,'gradePoints'), grade: optionalText(body.grade,'grade',2), sourceReference: optionalText(body.sourceReference,'sourceReference',200) };
  if (status === 'RECOGNIZED' && (value.score !== null || value.gradePoints !== null)) throw academicError('Recognized courses earn credit but must not have GPA scores.');
  return value;
}
export function pagination(params: Record<string, unknown>, allowed: string[]) {
  for (const key of Object.keys(params)) if (!['page','limit',...allowed].includes(key)) throw academicError(`Unknown query parameter: ${key}.`);
  const page = params.page === undefined ? 1 : positiveId(params.page,'page');
  const limit = params.limit === undefined ? 20 : positiveId(params.limit,'limit');
  if (limit > 100) throw academicError('limit must not exceed 100.');
  return { page, limit, offset: (page-1)*limit };
}
export function batchId(value: unknown): string {
  if (typeof value !== 'string' || !/^[1-9]\d{0,18}$/.test(value) || BigInt(value) > 9223372036854775807n) throw academicError('Invalid import id.');
  return value;
}
