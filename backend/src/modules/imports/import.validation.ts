export const fail = (message: string, statusCode = 400, errorCode = 'INVALID_IMPORT') =>
  Object.assign(new Error(message), { statusCode, errorCode });

export interface PositionInput { code: string; title: string; description: string; requirements: string; capacity: number }
export interface ImportRow { code: string; email: string; fullName: string; name?: string; address?: string; positions?: PositionInput[]; academic?: Record<string, any> }
export interface ImportInput { kind: 'STUDENT' | 'ENTERPRISE'; idempotencyKey: string; semesterId?: number; windowId?: number; rows: ImportRow[] }

const text = (v: unknown, label: string, max: number) => {
  if (typeof v !== 'string' || !v.trim() || v.trim().length > max) throw fail(`${label} is required (maximum ${max} characters).`);
  return v.trim();
};
export function validateImport(body: unknown): ImportInput {
  if (!body || typeof body !== 'object') throw fail('Import body is required.');
  const b = body as Record<string, unknown>;
  if (b.kind !== 'STUDENT' && b.kind !== 'ENTERPRISE') throw fail('kind must be STUDENT or ENTERPRISE.');
  const idempotencyKey = text(b.idempotencyKey, 'idempotencyKey', 100);
  if (!Array.isArray(b.rows) || b.rows.length < 1 || b.rows.length > 500) throw fail('Import between 1 and 500 rows per batch.');
  const semesterId = undefined;
  if (b.kind === 'ENTERPRISE' && (b.semesterId !== undefined || b.windowId !== undefined))
    throw fail('Enterprise account import does not accept a semester or recruitment window.');
  const codes = new Set<string>(), emails = new Set<string>();
  const rows = b.rows.map((raw, index) => {
    try {
      if (!raw || typeof raw !== 'object') throw fail('Row must be an object.');
      const r = raw as Record<string, unknown>;
      const code = text(r.code, 'code', 20).toUpperCase();
      if (!/^[A-Z0-9_-]+$/.test(code)) throw fail('code must contain letters, digits, underscores or hyphens.');
      const email = text(r.email, 'email', 100).toLowerCase();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw fail('Invalid email.');
      if (codes.has(code) || emails.has(email)) throw fail('Duplicate code or email within the file.');
      codes.add(code); emails.add(email);
      const row: ImportRow = { code, email, fullName: text(r.fullName, 'fullName', 150) };
      if (b.kind === 'STUDENT') {
        if (!r.academic || typeof r.academic !== 'object' || Array.isArray(r.academic)) throw fail('academic profile, placement and courseResults are required.');
        row.academic = r.academic as Record<string, any>;
      }
      if (b.kind === 'ENTERPRISE') {
        row.name = text(r.name, 'name', 200);
        if (Object.keys(r).some(key => !['code','email','fullName','name'].includes(key)))
          throw fail('Enterprise account import accepts only code, email, fullName and name; enterprises manage their own profiles and recruitment.');
      }
      return row;
    } catch (error) { throw fail(`Row ${index + 1}: ${(error as Error).message}`); }
  });
  return { kind: b.kind, idempotencyKey, semesterId, rows };
}
