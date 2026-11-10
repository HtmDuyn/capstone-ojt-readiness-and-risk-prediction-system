import assert from 'node:assert/strict';
import test from 'node:test';
import * as XLSX from 'xlsx';
import * as CFB from 'cfb';
import { createCurriculumTemplateWorkbook } from '../../src/utils/curriculumTemplateWorkbook.ts';

test('mẫu khung chương trình có đúng hai sheet, sáu cột và định dạng tiêu đề', () => {
  const bytes = createCurriculumTemplateWorkbook();
  const workbook = XLSX.read(bytes, { type: 'array' });
  assert.deepEqual(workbook.SheetNames, ['Thông tin khung chương trình', 'Danh sách môn học']);
  assert.deepEqual(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1 }), [[
    'Mã khung chương trình', 'Tên khung chương trình', 'Mô tả',
    'Số quyết định', 'Ngày quyết định', 'Tổng tín chỉ',
  ]]);
  assert.deepEqual(XLSX.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[1]], { header: 1 }), [[
    'Mã môn học', 'Tên môn học', 'Kỳ khuyến nghị', 'Tín chỉ', 'Loại', 'Tiên quyết',
  ]]);

  const zip = CFB.read(bytes, { type: 'array' });
  const xml = path => new TextDecoder().decode(new Uint8Array(CFB.find(zip, `Root Entry/${path}`).content));
  const styles = xml('xl/styles.xml');
  assert.match(styles, /<fgColor rgb="FFEFF6FF"\/>/);
  assert.match(styles, /<b\/>/);
  assert.match(styles, /<numFmt numFmtId="164" formatCode="dd\/MM\/yyyy"\/>/);
  for (const number of [1, 2]) {
    const sheet = xml(`xl/worksheets/sheet${number}.xml`);
    assert.match(sheet, /<pane ySplit="1"/);
    assert.equal((sheet.match(/<c r="[A-F]1" s="1"/g) ?? []).length, 6);
  }
  assert.match(xml('xl/worksheets/sheet1.xml'), /<col min="5" max="5"[^>]*style="2"/);
});
