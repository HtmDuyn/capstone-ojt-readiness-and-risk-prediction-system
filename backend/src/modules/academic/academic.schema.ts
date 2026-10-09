export const academicError = (message: string, statusCode = 400, errorCode = 'INVALID_ACADEMIC_INPUT') =>
  Object.assign(new Error(message), { statusCode, errorCode });
export function positiveId(value: unknown, field = 'id'): number {
  if (!((typeof value === 'string' && /^[1-9]\d*$/.test(value)) || typeof value === 'number')) throw academicError(`${field} must be a positive integer.`);
  const n = Number(value);
  if (!Number.isSafeInteger(n) || n < 1 || n > 2147483647) throw academicError(`${field} must be a positive 32-bit integer.`);
  return n;
}
export function inputObject(value: unknown, keys: string[]): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw academicError('JSON object is required.');
  const body = value as Record<string, unknown>;
  for (const key of Object.keys(body)) if (!keys.includes(key)) throw academicError(`Unknown field: ${key}.`);
  if (!Object.keys(body).length) throw academicError('Provide at least one field.');
  return body;
}
export function requiredText(value: unknown, field: string, max: number): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > max) throw academicError(`${field} is required and must contain at most ${max} characters.`);
  return value.trim();
}
export function dateInput(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) throw academicError(`${field} must be YYYY-MM-DD.`);
  const date = new Date(`${value}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0,10) !== value || value < '1900-01-01' || value > '2200-12-31') throw academicError(`${field} is not a valid calendar date.`);
  return value;
}
export function dateRange(start: string, end: string, field = 'date range') {
  if (end < start) throw academicError(`${field}: end date must be on or after start date.`);
}
export function statusInput(value: unknown, defaultValue = 'PLANNED'): string {
  const status = value === undefined ? defaultValue : value;
  if (typeof status !== 'string' || !['PLANNED','ACTIVE','CLOSED','ARCHIVED'].includes(status)) throw academicError('status must be PLANNED, ACTIVE, CLOSED or ARCHIVED.');
  return status;
}
export function pageInput(q: Record<string, unknown>) {
  const page = q.page === undefined ? 1 : positiveId(q.page, 'page');
  const limit = q.limit === undefined ? 20 : positiveId(q.limit, 'limit');
  if (limit > 100 || (page - 1) * limit > 2147483647) throw academicError('Pagination exceeds allowed range (limit <= 100).');
  const search = q.search === undefined ? null : requiredText(q.search, 'search', 100);
  const status = q.status === undefined ? null : statusInput(q.status);
  return { page, limit, offset: (page - 1) * limit, search, status };
}
