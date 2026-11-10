import * as XLSX from 'xlsx';
import * as CFB from 'cfb';

const TEMPLATE_NAME = 'Mau_Import_Khung_Chuong_Trinh.xlsx';

const sheets = [
  {
    name: 'Thông tin khung chương trình',
    headers: ['Mã khung chương trình', 'Tên khung chương trình', 'Mô tả', 'Số quyết định', 'Ngày quyết định', 'Tổng tín chỉ'],
    widths: [28, 38, 40, 22, 20, 18],
  },
  {
    name: 'Danh sách môn học',
    headers: ['Mã môn học', 'Tên môn học', 'Kỳ khuyến nghị', 'Tín chỉ', 'Loại', 'Tiên quyết'],
    widths: [20, 40, 20, 14, 22, 42],
  },
] as const;

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
  for (const { name, headers, widths } of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet([[...headers]]);
    sheet['!cols'] = widths.map(wch => ({ wch }));
    XLSX.utils.book_append_sheet(workbook, sheet, name);
  }

  const zip = CFB.read(new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' })), { type: 'array' });
  replacePart(zip, 'xl/styles.xml', xml => xml
    .replace(/<numFmts count="(\d+)">/, (_, count: string) => `<numFmts count="${Number(count) + 1}">`)
    .replace('</numFmts>', '<numFmt numFmtId="164" formatCode="dd/MM/yyyy"/></numFmts>')
    .replace('<fonts count="1">', '<fonts count="2">')
    .replace('</fonts>', '<font><sz val="12"/><color rgb="FF334155"/><name val="Calibri"/><b/></font></fonts>')
    .replace('<fills count="2">', '<fills count="3">')
    .replace('</fills>', '<fill><patternFill patternType="solid"><fgColor rgb="FFEFF6FF"/><bgColor indexed="64"/></patternFill></fill></fills>')
    .replace('</cellXfs>', '<xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs>')
    .replace('<cellXfs count="1">', '<cellXfs count="3">'));

  sheets.forEach((sheet, index) => {
    replacePart(zip, `xl/worksheets/sheet${index + 1}.xml`, xml => (index === 0
      ? xml.replace(/(<col min="5" max="5"[^>]*)(\/>)/, '$1 style="2"$2')
      : xml)
      .replace('<sheetView workbookViewId="0"/>', '<sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView>')
      .replace(/(<c r="[A-F]1")/g, '$1 s="1"'));
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
