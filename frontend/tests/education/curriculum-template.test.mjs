import assert from 'node:assert/strict';
import test from 'node:test';
import * as XLSX from 'xlsx';
import * as CFB from 'cfb';
import { createCurriculumTemplateWorkbook, curriculumImportSheets } from '../../src/utils/curriculumTemplateWorkbook.ts';

test('mẫu khung chương trình khớp cấu trúc import và giữ định dạng tiêu đề', () => {
  const bytes = createCurriculumTemplateWorkbook();
  const workbook = XLSX.read(bytes, { type: 'array' });
  assert.deepEqual(workbook.SheetNames, Object.keys(curriculumImportSheets));
  for (const [name, headers] of Object.entries(curriculumImportSheets)) {
    assert.deepEqual(XLSX.utils.sheet_to_json(workbook.Sheets[name], { header: 1 }), [headers]);
  }

  const zip = CFB.read(bytes, { type: 'array' });
  const xml = path => new TextDecoder().decode(new Uint8Array(CFB.find(zip, `Root Entry/${path}`).content));
  const styles = xml('xl/styles.xml');
  assert.match(styles, /<fgColor rgb="FFEFF6FF"\/>/);
  assert.match(styles, /<b\/>/);
  for (const [index, headers] of Object.values(curriculumImportSheets).entries()) {
    const sheet = xml(`xl/worksheets/sheet${index + 1}.xml`);
    assert.match(sheet, /<pane ySplit="1"/);
    assert.equal((sheet.match(/<c r="[A-Z]1" s="1"/g) ?? []).length, headers.length);
  }
});
