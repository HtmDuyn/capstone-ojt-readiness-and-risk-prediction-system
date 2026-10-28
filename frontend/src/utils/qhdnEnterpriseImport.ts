import * as XLSX from "xlsx";
import type { EnterpriseImportRow } from "../types/qhdn/qhdnTypes";

const requiredHeaders = [
  "code", "email", "fullName", "name", "positionCode", "title",
  "description", "requirements", "capacity",
];

/** Convert one spreadsheet row per position into the account-import JSON contract. */
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
    const capacity = Number(get("capacity"));
    if (!Number.isSafeInteger(capacity) || capacity < 1 || capacity > 2147483647)
      fail("capacity phải là số nguyên dương, tối đa 2147483647.");
    const profile = {
      code: get("code").toUpperCase(), email,
      fullName: get("fullName"), name: get("name"),
      ...(get("address") ? { address: get("address") } : {}),
    };
    const existing = groups.get(email);
    if (existing) {
      const { positions: _positions, ...previousProfile } = existing;
      if (JSON.stringify(previousProfile) !== JSON.stringify(profile))
        fail("thông tin doanh nghiệp không nhất quán giữa các vị trí cùng email.");
    }
    const target = existing ?? { ...profile, positions: [] };
    const positionCode = get("positionCode").toUpperCase();
    if (target.positions.some((position) => position.code === positionCode))
      fail("mã vị trí bị trùng trong cùng doanh nghiệp.");
    if (target.positions.length >= 50) fail("mỗi doanh nghiệp chỉ được có tối đa 50 vị trí.");
    target.positions.push({
      code: positionCode, title: get("title"), description: get("description"),
      requirements: get("requirements"), capacity,
    });
    groups.set(email, target);
    if (groups.size > 500) fail("mỗi lần import chỉ được có tối đa 500 doanh nghiệp.");
  }
  if (!groups.size) throw new Error("File không có dòng dữ liệu doanh nghiệp.");
  return [...groups.values()];
}
