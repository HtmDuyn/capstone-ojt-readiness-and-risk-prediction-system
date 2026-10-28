import ExcelJS from 'exceljs';
import multer from 'multer';
import { Readable } from 'node:stream';
import { extname } from 'node:path';
import { fail, validateImport, type ImportInput } from '../imports/import.validation';
import { positiveId } from '../students/student.validation';

export const receiveEnterpriseImport = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1, fields: 8 },
  fileFilter: (_req, file, done) => {
    if (!['.xlsx', '.csv'].includes(extname(file.originalname).toLowerCase())) return done(fail('Use an .xlsx or .csv file.'));
    done(null, true);
  },
}).single('file');

const fields = ['code', 'email', 'fullName', 'name', 'address', 'positionCode', 'title', 'description', 'requirements', 'capacity'] as const;
const text = (value: unknown) => typeof value === 'string' ? value.trim() : value;
const optionalText = (value: unknown) => value == null || (typeof value === 'string' && !value.trim()) ? undefined : text(value);
const positionInput = (raw: Record<string, any>) => ({
  code: text(raw.code), title: text(raw.title), description: text(raw.description), requirements: text(raw.requirements),
  capacity: typeof raw.capacity === 'string' && raw.capacity.trim() ? Number(raw.capacity) : raw.capacity,
});

export async function enterpriseImportInput(body: unknown, file?: Express.Multer.File): Promise<ImportInput> {
  if (!body || typeof body !== 'object' || Array.isArray(body)) throw fail('Import body is required.');
  const b = body as Record<string, any>;
  if (Object.keys(b).some(key => !['kind', 'idempotencyKey', 'ojtSemesterId', 'semesterId', 'rows', 'mapping'].includes(key))) throw fail('Use ojtSemesterId and enterprise data; recruitment windowId is not supported.');
  if (b.kind !== 'ENTERPRISE') throw fail('This endpoint imports enterprises for QHDN.', 403, 'FORBIDDEN');
  const semesterId = positiveId(b.ojtSemesterId ?? b.semesterId, 'ojtSemesterId');
  if (b.semesterId !== undefined && positiveId(b.semesterId, 'semesterId') !== semesterId) throw fail('Conflicting semester IDs.');
  let rows: Record<string, any>[];
  if (file) {
    if (b.rows !== undefined) throw fail('Provide a file or JSON rows, not both.');
    let mapping: Record<string, string> = {};
    try { mapping = typeof b.mapping === 'string' ? JSON.parse(b.mapping) : b.mapping ?? {}; }
    catch { throw fail('mapping must be a JSON object.'); }
    if (!mapping || typeof mapping !== 'object' || Array.isArray(mapping)
      || Object.entries(mapping).some(([key, value]) => !fields.includes(key as typeof fields[number]) || typeof value !== 'string' || !value.trim())) throw fail('Invalid column mapping.');
    const workbook = new ExcelJS.Workbook();
    try {
      if (extname(file.originalname).toLowerCase() === '.csv') await workbook.csv.read(Readable.from([file.buffer]), { map: value => value });
      else await workbook.xlsx.load(Uint8Array.from(file.buffer).buffer);
    } catch { throw fail('The spreadsheet could not be read.'); }
    const sheet = workbook.getWorksheet('EnterpriseImport') ?? workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 2 || sheet.rowCount > 5001) throw fail('Provide 1–5000 spreadsheet data rows.');
    const headers = new Map<string, number>();
    sheet.getRow(1).eachCell((cell, index) => {
      const header = cell.text.trim();
      if (headers.has(header)) throw fail('Duplicate spreadsheet header: ' + header);
      headers.set(header, index);
    });
    for (const field of fields.filter(key => key !== 'address')) if (!headers.has(mapping[field] ?? field)) throw fail('Missing spreadsheet column: ' + field);
    rows = [];
    for (let index = 2; index <= sheet.rowCount; index++) {
      const row: Record<string, any> = {};
      for (const field of fields) {
        const column = headers.get(mapping[field] ?? field);
        row[field] = column ? sheet.getRow(index).getCell(column).text.trim() : undefined;
      }
      if (Object.values(row).every(value => value === undefined || value === '')) continue;
      rows.push(row);
    }
  } else {
    if (b.mapping !== undefined) throw fail('mapping applies only to spreadsheet files.');
    if (!Array.isArray(b.rows) || !b.rows.length || b.rows.length > 5000) throw fail('Provide 1–5000 data rows.');
    rows = b.rows;
  }
  const grouped = new Map<string, Record<string, any>>();
  for (const [index, raw] of rows.entries()) {
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw fail(`Row ${index + 1}: invalid enterprise row.`);
    const company = {
      code: typeof raw.code === 'string' ? raw.code.trim().toUpperCase() : raw.code,
      email: typeof raw.email === 'string' ? raw.email.trim().toLowerCase() : raw.email,
      fullName: text(raw.fullName), name: text(raw.name), address: optionalText(raw.address),
    };
    const key = JSON.stringify([company.code, company.email]);
    let entry = grouped.get(key);
    if (!entry) { entry = { ...company, positions: [] }; grouped.set(key, entry); }
    else {
      if (['fullName', 'name'].some(field => entry![field] !== company[field as keyof typeof company])
        || (entry.address !== undefined && company.address !== undefined && entry.address !== company.address)) throw fail(`Row ${index + 1}: conflicting details for the same enterprise.`);
      entry.address ??= company.address;
    }
    if (Array.isArray(raw.positions)) entry.positions.push(...raw.positions.map((position: any) => {
      if (!position || typeof position !== 'object' || Array.isArray(position)) throw fail(`Row ${index + 1}: invalid position.`);
      return positionInput(position);
    }));
    else entry.positions.push({ code: text(raw.positionCode), title: text(raw.title), description: text(raw.description), requirements: text(raw.requirements), capacity: typeof raw.capacity === 'string' && raw.capacity.trim() ? Number(raw.capacity) : raw.capacity });
  }
  // Keep the existing student validator untouched. This adapter only normalizes
  // QHDN's flat Excel rows into the established enterprise/positions structure.
  return validateImport({ kind: 'ENTERPRISE', semesterId, idempotencyKey: b.idempotencyKey, rows: [...grouped.values()] });
}
