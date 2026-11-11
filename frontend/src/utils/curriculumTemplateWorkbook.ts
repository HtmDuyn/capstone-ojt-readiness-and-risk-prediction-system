import * as XLSX from 'xlsx';
import * as CFB from 'cfb';

const TEMPLATE_NAME = 'Mau_Import_Khung_Chuong_Trinh.xlsx';

export const curriculumImportSheets = {
  '01_Curriculum': ['code', 'name', 'version', 'majorCode', 'totalCredits', 'effectiveYear', 'gpaScale'],
  '02_Courses': ['courseCode', 'credits', 'semester', 'isRequired', 'entryKind', 'prerequisiteText'],
  '03_Prerequisites': ['courseCode', 'groupCode', 'minimumPassed', 'prerequisiteCourseCodes'],
  '04_Combos': ['code', 'name', 'selectionGroup', 'note'],
  '05_ComboCourses': ['comboCode', 'courseCode', 'credits', 'semester', 'slotCourseCodes', 'prerequisiteText', 'note'],
  '06_ChoiceGroups': ['comboCode', 'code', 'minCourses', 'maxCourses', 'courseCodes'],
  '07_Equivalences': ['sourceCourseCode', 'targetCourseCode', 'reason'],
} as const;

const sheets = Object.entries(curriculumImportSheets);

// SheetJS Community writes the data and column widths. Its writer does not
// serialize header styles or frozen panes, so finish those two XLSX parts here.
const replacePart = (zip: any, path: string, transform: (xml: string) => string) => {
  const part = CFB.find(zip, `Root Entry/${path}`);
  if (!part?.content) throw new Error(`Không thể tạo file mẫu: thiếu ${path}.`);
  const original = new TextDecoder().decode(new Uint8Array(part.content));
  const updated = transform(original);
  if (updated === original) throw new Error(`Không thể định dạng file mẫu: ${path}.`);
  CFB.utils.cfb_add(zip, `Root Entry/${path}`, new TextEncoder().encode(updated));
};

export const createCurriculumTemplateWorkbook = (): Uint8Array => {
  const workbook = XLSX.utils.book_new();
  for (const [name, headers] of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet([[...headers]]);
    sheet['!cols'] = headers.map(header => ({ wch: Math.max(18, header.length + 4) }));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  const zip = CFB.read(new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })), { type: 'array' });
  replacePart(zip, 'xl/styles.xml', xml => xml
    .replace('<fonts count="1">', '<fonts count="2">')
    .replace('</fonts>', '<font><sz val="12"/><color rgb="FF334155"/><name val="Calibri"/><b/></font></fonts>')
    .replace('<fills count="2">', '<fills count="3">')
    .replace('</fills>', '<fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills>')
    .replace('</cellXfs>', '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/></cellXfs>')
    .replace('<cellXfs count="1">', '<cellXfs count="2">'));

  sheets.forEach((_, index) => {
    replacePart(zip, `xl/worksheets/sheet${index + 1}.xml`, xml => xml
      .replace('<sheetView workbookViewId="0"/>', '<sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView>')
      .replace(/(<c r="[A-Z]+1")/g, '$1 s="1"'));
  });
  return new Uint8Array(CFB.write(zip, { type: 'array', fileType: 'zip' }));
};

export const downloadCurriculumTemplate = () => {
  const bytes = createCurriculumTemplateWorkbook();
  const blob = new Blob([bytes as BlobPart], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = TEMPLATE_NAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};
