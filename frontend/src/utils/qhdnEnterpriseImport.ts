import * as XLSX from "xlsx";
import type { EnterpriseImportRow } from "../types/qhdn/qhdnTypes";

const requiredHeaders = [
  "email", "fullName", "name",
];
export const ENTERPRISE_IMPORT_MAX_ROWS = 500;
export const ENTERPRISE_IMPORT_MAX_BYTES = 8 * 1024 * 1024;

export function enterpriseImportTemplate(): ArrayBuffer {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([['name', 'fullName', 'email']]);
  sheet['!cols'] = [{ wch: 38 }, { wch: 30 }, { wch: 38 }];
  XLSX.utils.book_append_sheet(workbook, sheet, 'Doanh nghiep');
  const instructions = XLSX.utils.aoa_to_sheet([
    ['Cột / mục', 'Ý nghĩa', 'Giới hạn'],
    ['name', 'Tên doanh nghiệp.', '200 ký tự'],
    ['fullName', 'Họ tên người phụ trách nhận tài khoản.', '150 ký tự'],
    ['email', 'Email đăng nhập và nhận thông tin tài khoản.', '100 ký tự'],
    ['Mã doanh nghiệp', 'Hệ thống tự sinh mã dạng DN000001 khi tạo tài khoản. Không cần nhập cột code.', 'Mã chính thức được gửi trong email tài khoản'],
    ['Cách dùng', 'Nhập dữ liệu ở sheet Doanh nghiep, giữ nguyên hàng tiêu đề. Mỗi dòng là một doanh nghiệp.', 'Tối đa 500 doanh nghiệp/lần'],
    ['Tài khoản', 'Hệ thống tạo mật khẩu tạm và gửi thông tin đăng nhập đến email của từng doanh nghiệp.', 'Không nhập mật khẩu vào file'],
    ['Trùng dữ liệu', 'Email không được trùng trong file hoặc trùng tài khoản hiện có.', 'Không ghi đè tài khoản cũ'],
  ]);
  instructions['!cols'] = [{ wch: 20 }, { wch: 105 }, { wch: 32 }];
  XLSX.utils.book_append_sheet(workbook, instructions, 'Huong dan');
  return XLSX.write(workbook, { type: 'array', bookType: 'xlsx' });
}

export async function parseEnterpriseImportFile(file: Pick<File, 'name' | 'size' | 'arrayBuffer'>): Promise<EnterpriseImportRow[]> {
  if (!/\.(xlsx|csv)$/i.test(file.name)) throw new Error('Chỉ hỗ trợ file Excel .xlsx hoặc CSV .csv.');
  if (!file.size) throw new Error('File trống. Vui lòng chọn file có dữ liệu doanh nghiệp.');
  if (file.size > ENTERPRISE_IMPORT_MAX_BYTES) throw new Error('File tối đa 8 MB.');
  return parseEnterpriseImportSheet(await file.arrayBuffer());
}

/** One spreadsheet row provisions one enterprise account; recruitment is enterprise-managed. */
export function parseEnterpriseImportSheet(data: ArrayBuffer): EnterpriseImportRow[] {
  let workbook: XLSX.WorkBook;
  try {
    workbook = XLSX.read(data, { type: "array", codepage: 65001 });
  } catch {
    throw new Error("Không đọc được file. Vui lòng chọn file XLSX hoặc CSV hợp lệ.");
  }
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  if (!sheet || !sheet["!ref"])
    throw new Error("File cần có hàng tiêu đề và ít nhất một dòng dữ liệu.");
  const range = XLSX.utils.decode_range(sheet["!ref"]);
  if (range.e.r > 5000 || range.e.c >= 100)
    throw new Error("File chỉ được chứa tối đa 5.000 dòng dữ liệu và 100 cột.");
  const table = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1, raw: false, defval: "", blankrows: true, range: 0,
  });
  const headers = (table[0] ?? []).map((value) => String(value).trim());
  const namedHeaders = headers.filter(Boolean);
  if (new Set(namedHeaders).size !== namedHeaders.length)
    throw new Error("File có tên cột trùng nhau. Vui lòng kiểm tra hàng tiêu đề.");
  if (namedHeaders.some(field => ![...requiredHeaders, 'code'].includes(field))) throw new Error("Chỉ hỗ trợ 3 cột bắt buộc: name, fullName, email; cột code trong file cũ là tùy chọn. Không nhập JD, vị trí hoặc hồ sơ doanh nghiệp.");
  const missing = requiredHeaders.filter((field) => !headers.includes(field));
  if (missing.length)
    throw new Error("File thiếu cột bắt buộc: " + missing.join(", ") + ".");

  const groups = new Map<string, EnterpriseImportRow>();
  const codes = new Set<string>();
  for (let index = 1; index < table.length; index++) {
    const values = table[index];
    if (!values.some((value) => String(value).trim())) continue;
    const get = (field: string) => String(values[headers.indexOf(field)] ?? "").trim();
    const fail = (message: string): never => {
      throw new Error(`Dòng ${index + 1}: ${message}`);
    };
    if (values.some((value, column) => String(value).trim() && !headers[column])) fail('có dữ liệu ở cột không có tiêu đề.');
    for (const field of requiredHeaders) {
      if (!get(field)) fail(`thiếu dữ liệu cột ${field}.`);
    }
    const email = get("email").toLowerCase();
    if (email.length > 100) fail('email tối đa 100 ký tự.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("email không hợp lệ.");
    const code = get('code').toUpperCase();
    const profile = {
      ...(code ? { code } : {}), email,
      fullName: get("fullName"), name: get("name"),

    };
    if (code && (code.length > 20 || !/^[A-Z0-9_-]+$/.test(code))) fail('mã doanh nghiệp chỉ gồm chữ cái, số, dấu gạch ngang hoặc gạch dưới, tối đa 20 ký tự.');
    if (profile.name.length > 200) fail('tên doanh nghiệp tối đa 200 ký tự.');
    if (profile.fullName.length > 150) fail('tên người phụ trách tối đa 150 ký tự.');
    if (groups.has(email) || (code && codes.has(code))) fail("Trùng mã hoặc email doanh nghiệp.");
    groups.set(email, profile);
    if (code) codes.add(code);
    if (groups.size > ENTERPRISE_IMPORT_MAX_ROWS) fail("mỗi lần import chỉ được có tối đa 500 doanh nghiệp.");
  }
  if (!groups.size) throw new Error("File không có dòng dữ liệu doanh nghiệp.");
  return [...groups.values()];
}
