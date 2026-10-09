export const fail = (message: string, statusCode = 400, errorCode = 'INVALID_IMPORT') =>
  Object.assign(new Error(message), { statusCode, errorCode });

export interface PositionInput { code: string; title: string; description: string; requirements: string; capacity: number }
export interface ImportRow { code: string; email: string; fullName: string; name?: string; address?: string; positions?: PositionInput[] }
export interface ImportInput { kind: 'STUDENT' | 'ENTERPRISE'; idempotencyKey: string; semesterId?: number; rows: ImportRow[] }

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
  const semesterId = b.kind === 'ENTERPRISE' ? Number(b.semesterId) : undefined;
  if (b.kind === 'ENTERPRISE' && (!Number.isSafeInteger(semesterId) || semesterId! <= 0)) throw fail('semesterId is required.');
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
      if (b.kind === 'ENTERPRISE') {
        row.name = text(r.name, 'name', 200);
        row.address = r.address === undefined ? undefined : text(r.address, 'address', 300);
        if (!Array.isArray(r.positions) || !r.positions.length || r.positions.length > 50) throw fail('Each enterprise requires 1–50 positions.');
        const positionCodes = new Set<string>();
        row.positions = r.positions.map(p => {
          if (!p || typeof p !== 'object') throw fail('Position must be an object.');
          const code = text(p.code, 'position.code', 60).toUpperCase();
          if (positionCodes.has(code)) throw fail('Duplicate position code.');
          positionCodes.add(code);
          if (!Number.isSafeInteger(p.capacity) || p.capacity < 1 || p.capacity > 2147483647) throw fail('capacity must be a positive 32-bit integer.');
          return { code, title: text(p.title, 'position.title', 150), description: text(p.description, 'position.description', 10000), requirements: text(p.requirements, 'position.requirements', 10000), capacity: p.capacity };
        });
      }
      return row;
    } catch (error) { throw fail(`Row ${index + 1}: ${(error as Error).message}`); }
  });
  return { kind: b.kind, idempotencyKey, semesterId, rows };
}
