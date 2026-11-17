import test from 'node:test';
import assert from 'node:assert/strict';
import * as XLSX from 'xlsx';
import { enterpriseImportTemplate, parseEnterpriseImportFile, parseEnterpriseImportSheet, ENTERPRISE_IMPORT_MAX_BYTES } from '../../src/utils/qhdnEnterpriseImport.ts';

const headers = ['name', 'fullName', 'email'];
const row = ['Công ty Công nghệ Việt', 'Nguyễn Văn An', 'HR@EXAMPLE.TEST'];
function workbook(rows, columns = headers) {
  const book = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(book, XLSX.utils.aoa_to_sheet([columns, ...rows]), 'Doanh nghiep');
  return XLSX.write(book, { type: 'array', bookType: 'xlsx' });
}

test('download template contains the exact account columns and a separate instructions sheet', () => {
  const book = XLSX.read(enterpriseImportTemplate(), { type: 'array' });
  assert.deepEqual(book.SheetNames, ['Doanh nghiep', 'Huong dan']);
  assert.deepEqual(XLSX.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], { header: 1 }), [headers]);
  XLSX.utils.sheet_add_aoa(book.Sheets[book.SheetNames[0]], [row], { origin: 'A2' });
  assert.deepEqual(parseEnterpriseImportSheet(XLSX.write(book, { type: 'array', bookType: 'xlsx' })), [
    { name: row[0], fullName: row[1], email: 'hr@example.test' },
  ]);
});

test('XLSX and UTF-8 CSV preserve Vietnamese names and normalize identity fields', async () => {
  const file = new File([workbook([row])], 'doanh-nghiep.xlsx');
  assert.equal((await parseEnterpriseImportFile(file))[0].fullName, 'Nguyễn Văn An');
  const csv = '\ufeffemail,name,fullName\r\nHR@EXAMPLE.TEST,"Công ty Việt, Nam",Nguyễn Văn An\r\n';
  assert.deepEqual(await parseEnterpriseImportFile(new File([csv], 'doanh-nghiep.csv')), [
    { name: 'Công ty Việt, Nam', fullName: 'Nguyễn Văn An', email: 'hr@example.test' },
  ]);
});

test('duplicate emails are rejected and legacy code columns remain supported', () => {
  assert.throws(() => parseEnterpriseImportSheet(workbook([row, ['Other', 'Other', 'hr@example.test']])), /Dòng 3: Trùng/);
  const columns = [...headers, 'code'];
  assert.equal(parseEnterpriseImportSheet(workbook([[...row, 'dn_01']], columns))[0].code, 'DN_01');
  assert.equal(Object.hasOwn(parseEnterpriseImportSheet(workbook([[...row, '']], columns))[0], 'code'), false);
  assert.throws(() => parseEnterpriseImportSheet(workbook([[...row, 'dn_01'], ['Other', 'Other', 'other@example.test', 'DN_01']], columns)), /Dòng 3: Trùng/);
});

test('invalid cells identify the physical spreadsheet row, including intervening blank rows', () => {
  assert.throws(() => parseEnterpriseImportSheet(workbook([row, [], ['', 'Contact', 'contact@example.test']])), /Dòng 4: thiếu dữ liệu cột name/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([[...row, 'DN 01']], [...headers, 'code'])), /Dòng 2: mã doanh nghiệp/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([['Name', 'Contact', 'invalid-email']])), /Dòng 2: email không hợp lệ/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([['x'.repeat(201), 'Contact', 'contact@example.test']])), /tên doanh nghiệp tối đa 200/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([['Name', 'x'.repeat(151), 'contact@example.test']])), /tên người phụ trách tối đa 150/);
});

test('missing, duplicate, unknown and populated unnamed columns are rejected', () => {
  assert.throws(() => parseEnterpriseImportSheet(workbook([], ['code', 'name'])), /thiếu cột bắt buộc/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([], ['code', 'code', 'fullName', 'email'])), /tên cột trùng/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([], [...headers, 'password'])), /Chỉ hỗ trợ 3 cột/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([[...row, 'Extra']], [...headers, ''])), /cột không có tiêu đề/);
});

test('imports accept 500 enterprises and reject an extra row or an empty file', () => {
  const rows = Array.from({ length: 500 }, (_, index) => ['Company ' + index, 'Contact', `hr${index}@example.test`]);
  assert.equal(parseEnterpriseImportSheet(workbook(rows)).length, 500);
  assert.throws(() => parseEnterpriseImportSheet(workbook([...rows, ['Company', 'Contact', 'hr500@example.test']])), /tối đa 500 doanh nghiệp/);
  assert.throws(() => parseEnterpriseImportSheet(workbook([])), /không có dòng dữ liệu/);
});

test('unsupported, empty and oversized uploads fail before reading contents', async () => {
  let reads = 0;
  const file = { name: 'file.xls', size: 10, arrayBuffer: async () => { reads++; throw Error('Unexpected file read'); } };
  await assert.rejects(parseEnterpriseImportFile(file), /Chỉ hỗ trợ/);
  await assert.rejects(parseEnterpriseImportFile({ ...file, name: 'file.xlsx', size: 0 }), /File trống/);
  await assert.rejects(parseEnterpriseImportFile({ ...file, name: 'file.xlsx', size: ENTERPRISE_IMPORT_MAX_BYTES + 1 }), /8 MB/);
  assert.equal(reads, 0);
});
