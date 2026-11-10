import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { stripTypeScriptTypes } from 'node:module';
import path from 'node:path';
import test from 'node:test';
import { pathToFileURL } from 'node:url';
import XLSX from 'xlsx';

const sourcePath = path.resolve('src/utils/studentImportWorkbook.ts');
const xlsxUrl = pathToFileURL(path.resolve('node_modules/xlsx/xlsx.js')).href;
const source = readFileSync(sourcePath, 'utf8');
const compiled = stripTypeScriptTypes(source).replace('import * as XLSX from "xlsx";', `import XLSX from "${xlsxUrl}";`);
const workbookModule = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString('base64')}`);

test('file mẫu tải xuống có hai sheet, đúng cột và header cố định', () => {
  const bytes = workbookModule.createStudentImportTemplateFile();
  const book = XLSX.read(bytes, { type: 'array' });
  assert.deepEqual(book.SheetNames, ['Danh sách sinh viên', 'Kết quả học tập']);
  assert.deepEqual(XLSX.utils.sheet_to_json(book.Sheets['Danh sách sinh viên'], { header: 1 })[0], [
    'Họ và tên', 'Mã sinh viên', 'Email', 'Số điện thoại', 'Mã chương trình đào tạo',
    'Trạng thái học vụ', 'Khóa', 'Nhóm', 'Học kỳ hiện tại',
  ]);
  assert.deepEqual(XLSX.utils.sheet_to_json(book.Sheets['Kết quả học tập'], { header: 1 })[0], [
    'Mã sinh viên', 'Mã môn', 'Tên môn', 'Kỳ học', 'Lần học', 'Trạng thái', 'Điểm số',
  ]);
  const archive = XLSX.CFB.read(bytes, { type: 'array' });
  const xml = suffix => {
    const index = archive.FullPaths.findIndex(value => value.endsWith(`/${suffix}`));
    assert.notEqual(index, -1);
    return Buffer.from(archive.FileIndex[index].content).toString('utf8');
  };
  assert.match(xml('xl/styles.xml'), /<b\/>.*<color rgb="FF334155"\/>/);
  assert.match(xml('xl/styles.xml'), /<fgColor rgb="FFEFF6FF"\/>/);
  for (const index of [1, 2]) {
    const sheetXml = xml(`xl/worksheets/sheet${index}.xml`);
    assert.match(sheetXml, /<pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"\/>/);
    assert.match(sheetXml, /<c r="A1" s="[1-9]\d*"/);
  }
});

test('parser đọc được file có tiêu đề mới và tạo payload gồm Nhóm cùng kỳ học của từng môn', async () => {
  const book = XLSX.read(workbookModule.createStudentImportTemplateFile(), { type: 'array' });
  XLSX.utils.sheet_add_aoa(book.Sheets['Danh sách sinh viên'], [[
    'Nguyễn Văn A', 'SE250001', 'student@example.com', '0123456789', 'BIT_IS_K19B',
    'Đang học', 'K19', 'A', 'FALL2026',
  ]], { origin: 'A2' });
  XLSX.utils.sheet_add_aoa(book.Sheets['Kết quả học tập'], [[
    'SE250001', 'PRF192', 'Lập trình cơ bản', 'SUMMER2026', 1, 'PASSED', 8,
  ]], { origin: 'A2' });
  const file = new File([XLSX.write(book, { type: 'array', bookType: 'xlsx' })], 'import.xlsx');
  const option = (id, code) => ({ id, label: code, aliases: [code] });
  const rows = await workbookModule.parseStudentImportWorkbook(file, {
    programs: [option(1, 'BIT_IS_K19B')],
    cohorts: [option(2, 'K19')],
    periods: [option(3, 'FALL2026'), option(4, 'SUMMER2026')],
  });
  assert.equal(rows.length, 1);
  assert.equal(rows[0].academic.programId, 1);
  assert.deepEqual(rows[0].academic.placement, { cohortId: 2, groupCode: 'A', currentAcademicPeriodId: 3 });
  assert.deepEqual(rows[0].academic.courseResults, [{
    courseCode: 'PRF192', academicPeriodId: 4, status: 'PASSED', attemptNumber: 1, score: 8,
  }]);
});
