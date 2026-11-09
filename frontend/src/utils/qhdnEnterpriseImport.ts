import * as XLSX from "xlsx";
import type { EnterpriseImportRow } from "../types/qhdn/qhdnTypes";

const requiredHeaders = [
  "code", "email", "fullName", "name",
];

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
  if (namedHeaders.some(field => !requiredHeaders.includes(field))) throw new Error("Chỉ hỗ trợ 4 cột: code, email, fullName, name. Không nhập JD, vị trí hoặc hồ sơ doanh nghiệp.");
  const missing = requiredHeaders.filter((field) => !headers.includes(field));
  if (missing.length)
    throw new Error("File thiếu cột bắt buộc: " + missing.join(", ") + ".");

  const groups = new Map<string, EnterpriseImportRow>();
  for (let index = 1; index < table.length; index++) {
    const values = table[index];
    if (!values.some((value) => String(value).trim())) continue;
    const get = (field: string) => String(values[headers.indexOf(field)] ?? "").trim();
    const fail = (message: string): never => {
      throw new Error(`Dòng ${index + 1}: ${message}`);
    };
    for (const field of requiredHeaders) {
      if (!get(field)) fail(`thiếu dữ liệu cột ${field}.`);
    }
    const email = get("email").toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail("email không hợp lệ.");
    const profile = {
      code: get("code").toUpperCase(), email,
      fullName: get("fullName"), name: get("name"),

    };
    if (groups.has(email) || [...groups.values()].some(row=>row.code===profile.code)) fail("Trùng mã hoặc email doanh nghiệp.");
    groups.set(email, profile);
    if (groups.size > 500) fail("mỗi lần import chỉ được có tối đa 500 doanh nghiệp.");
  }
  if (!groups.size) throw new Error("File không có dòng dữ liệu doanh nghiệp.");
  return [...groups.values()];
}
