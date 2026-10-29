import type { AcademicCatalogs, CatalogOption } from '@/types/education/import.types';

import * as XLSX from "xlsx";

import type { CourseResultStatus, StudentAcademicStatus, StudentCourseResult, StudentImportRow, StudentPlacement } from '@/types/education/import.types';

type DataObject = Record<string, unknown>;

export const STUDENT_STATUS_LABELS: Record<StudentAcademicStatus, string> = {
  ACTIVE: 'Đang học', INACTIVE: 'Không hoạt động', SUSPENDED: 'Tạm ngưng', GRADUATED: 'Đã tốt nghiệp', DROPPED_OUT: 'Đã thôi học',
};

export const STUDENT_IMPORT_COLUMNS = [
  'Mã sinh viên', 'Họ và tên', 'Email', 'Số điện thoại', 'Lớp',
  'Chương trình đào tạo', 'Trạng thái học vụ', 'Khóa', 'Nhóm',
  'Học kỳ hiện tại',
];
export const COURSE_RESULT_COLUMNS = [
  'Mã sinh viên', 'Mã môn', 'Học kỳ ghi nhận', 'Lần học', 'Trạng thái',
  'Điểm số', 'Điểm hệ 4',
];

const text = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[đĐ]/g, "d")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const positiveId = (value: unknown): number | undefined => {
  const raw = text(value);
  if (!raw) return undefined;

  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

const getCell = (row: DataObject, aliases: string[]): string => {
  const keys = aliases.map(normalize);

  for (const [key, value] of Object.entries(row)) {
    if (keys.includes(normalize(key)) && text(value) !== "") {
      return text(value);
    }
  }

  return "";
};

const resolveOption = (
  input: string,
  options: CatalogOption[],
  label: string,
  row: number,
): number => {
  if (!input) {
    throw new Error(`Dòng ${row}: Thiếu ${label}.`);
  }

  const id = positiveId(input);

  const matches = options.filter(
    (item) =>
      (id !== undefined && item.id === id) ||
      item.aliases.some((alias) => normalize(alias) === normalize(input)),
  );

  if (matches.length === 0) {
    throw new Error(
      `Dòng ${row}: ${label} "${input}" không có trong danh mục Backend.`,
    );
  }

  if (matches.length > 1) {
    throw new Error(
      `Dòng ${row}: ${label} "${input}" trùng nhiều mục. Hãy dùng ID.`,
    );
  }

  return matches[0].id;
};

const readRows = (
  book: XLSX.WorkBook,
  sheetName: string,
  optional = false,
): DataObject[] => {
  const name =
    book.SheetNames.find(
      (item) => normalize(item) === normalize(sheetName),
    ) ??
    (!optional && book.SheetNames.length === 1
      ? book.SheetNames[0]
      : undefined);

  if (!name) {
    if (optional) {
      const extra=book.SheetNames.filter(name=>!['danhsachsinhvien','huongdan','danhmuc','lotrinh09'].includes(normalize(name)));
      if(extra.length)throw new Error('Không tìm thấy sheet Kết quả học tập; có sheet chưa nhận diện: '+extra.join(', ')+'. Hãy dùng đúng tên sheet để tránh bỏ sót điểm.');
      return [];
    }
    throw new Error(`Không tìm thấy sheet "${sheetName}".`);
  }

  const sheet = book.Sheets[name];

  if (!sheet) {
    throw new Error(`Không đọc được sheet "${sheetName}".`);
  }

  const rows = XLSX.utils.sheet_to_json<DataObject>(sheet, { defval: "" });

  const data = rows.filter((row) =>
    Object.values(row).some((v) => text(v) !== ""),
  );
  const aliases = sheetName === 'Danh sách sinh viên'
    ? [...STUDENT_IMPORT_COLUMNS, 'Trạng thái sinh viên', 'Học kỳ bắt đầu chuyên ngành', 'Kỳ hiện tại', 'Kỳ bắt đầu chuyên ngành', 'MSSV', 'code', 'Họ tên', 'fullName', 'phone', 'className', 'programId', 'programName', 'status', 'studentStatus', 'cohortId', 'cohortCode', 'groupCode', 'Kỳ nhập học chuyên ngành', 'Kỳ nhập học', 'entryAcademicPeriodId', 'currentAcademicPeriodId']
    : [...COURSE_RESULT_COLUMNS, 'Điểm chữ', 'Nguồn dữ liệu', 'Kỳ học', 'MSSV', 'code', 'courseCode', 'academicPeriodId', 'attemptNumber', 'status', 'score', 'gradePoints', 'grade', 'sourceReference'];
  const supported = new Set(aliases.map(normalize));
  const unknown = [...new Set(data.flatMap(row => Object.keys(row).filter(key => !supported.has(normalize(key)) && text(row[key]) !== '')))];
  if (unknown.length) throw new Error(`Sheet ${sheetName}: cột chưa được API import hỗ trợ hoặc sai tên: ${unknown.join(', ')}. Hãy dùng mẫu chuẩn để tránh bỏ sót dữ liệu.`);

  if (!data.length) {
    if (optional) return [];
    throw new Error(`Sheet "${sheetName}" chưa có dữ liệu.`);
  }

  return data;
};

// The downloadable file contains input data only. Catalog lookup and instructions
// belong to the import page, so the blank template can be downloaded offline.
export const createStudentImportWorkbook = (): XLSX.WorkBook => {
  const book = XLSX.utils.book_new();
  const sheets: [string, string[], number[], number[]][] = [
    ['Danh sách sinh viên', STUDENT_IMPORT_COLUMNS, [20, 28, 36, 18, 18, 30, 25, 16, 12, 25], STUDENT_IMPORT_COLUMNS.map((_, i) => i)],
    ['Kết quả học tập', COURSE_RESULT_COLUMNS, [20, 20, 25, 14, 20, 14, 16], [0, 1, 2, 4]],
  ];
  for (const [name, headers, widths, textColumns] of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet([headers]);
    sheet['!cols'] = widths.map(wch => ({ wch }));
    sheet['!rows'] = [{ hpt: 28 }];
    const maxRows = name === 'Danh sách sinh viên' ? 500 : 1000;
    // Text format protects student codes, phone zeroes and calendar codes.
    for (let r = 1; r <= maxRows; r++) for (const c of textColumns)
      sheet[XLSX.utils.encode_cell({ r, c })] = { t: 's', v: '', z: '@' };
    sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: maxRows, c: headers.length - 1 } });
    XLSX.utils.book_append_sheet(book, sheet, name);
  }
  return book;
};

export const downloadStudentImportTemplate = () =>
  XLSX.writeFile(createStudentImportWorkbook(), 'mau-import-sinh-vien-va-bang-diem-PDT.xlsx', { compression: true });

export const parseStudentImportWorkbook = async (
  file: File,
  catalogs: AcademicCatalogs,
): Promise<StudentImportRow[]> => {

  const book = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const rows = readRows(book, "Danh sách sinh viên");
  if (rows.length > 500) throw new Error("Mỗi lần import tối đa 500 sinh viên.");

  const seen = new Set<string>();
  const emails = new Set<string>();

  const students: StudentImportRow[] = rows.map((row, index) => {
    const number = index + 2;

    const code = getCell(row, ["Mã sinh viên", "MSSV", "code"]).toUpperCase();

    const fullName = getCell(row, ["Họ và tên", "Họ tên", "fullName"]);

    const email = getCell(row, ["Email"]).toLowerCase();

    if (!code || !fullName || !email) {
      throw new Error(`Dòng ${number}: Thiếu MSSV, họ tên hoặc email.`);
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(`Dòng ${number}: Email không hợp lệ.`);
    }
    if (code.length > 20 || !/^[A-Z0-9_-]+$/.test(code)) throw new Error(`Dòng ${number}: MSSV tối đa 20 ký tự, chỉ chữ, số, gạch dưới và gạch nối.`);
    if (fullName.length > 150 || email.length > 100) throw new Error(`Dòng ${number}: Họ tên tối đa 150 và email tối đa 100 ký tự.`);
    if (emails.has(email)) throw new Error(`Dòng ${number}: Trùng email ${email}.`);
    emails.add(email);

    if (seen.has(code.trim().toUpperCase())) {
      throw new Error(`Dòng ${number}: Trùng MSSV ${code}.`);
    }

    seen.add(code.trim().toUpperCase());

    const programId = resolveOption(
      getCell(row, ["Chương trình đào tạo", "programId", "programName"]),
      catalogs.programs,
      "chương trình đào tạo",
      number,
    );

    const cohortId = resolveOption(
      getCell(row, ["Khóa", "cohortId", "cohortCode"]),
      catalogs.cohorts,
      "khóa",
      number,
    );

    const currentAcademicPeriodId = resolveOption(
      getCell(row, ['Học kỳ hiện tại', "Kỳ hiện tại", "currentAcademicPeriodId"]),
      catalogs.periods,
      "kỳ hiện tại",
      number,
    );

    const group = getCell(row, ["Nhóm", "groupCode"]).toUpperCase();

    if (!["A", "B", "C", "D"].includes(group)) {
      throw new Error(`Dòng ${number}: Nhóm phải là A, B, C hoặc D.`);
    }
    const entry = getCell(row, ['Học kỳ bắt đầu chuyên ngành', 'Kỳ bắt đầu chuyên ngành', 'Kỳ nhập học chuyên ngành', 'Kỳ nhập học', 'entryAcademicPeriodId']);
    const entryAcademicPeriodId = entry ? resolveOption(entry, catalogs.periods, 'kỳ bắt đầu chuyên ngành', number) : undefined;
    if (catalogs.periods.find(period => period.id === entryAcademicPeriodId)?.kind === 'BLOCK3') throw new Error(`Dòng ${number}: Kỳ bắt đầu chuyên ngành phải là học kỳ thường, không phải Block 3.`);
    const rawStatus = getCell(row, ['Trạng thái học vụ', 'Trạng thái sinh viên', 'studentStatus', 'status']);
    const status = rawStatus ? (Object.keys(STUDENT_STATUS_LABELS) as StudentAcademicStatus[]).find(key => normalize(key) === normalize(rawStatus) || normalize(STUDENT_STATUS_LABELS[key]) === normalize(rawStatus)) : undefined;
    if (rawStatus && !status) throw new Error(`Dòng ${number}: Trạng thái sinh viên phải là ${Object.keys(STUDENT_STATUS_LABELS).join(', ')}.`);
    const phone = getCell(row, ['Số điện thoại', 'phone']);
    const className = getCell(row, ['Lớp', 'className']);
    if (phone.length > 20 || className.length > 20) throw new Error(`Dòng ${number}: Điện thoại và lớp tối đa 20 ký tự.`);

    return {
      code,
      fullName,
      email,
      academic: {
        programId,
        ...(status ? { status } : {}),
        ...(getCell(row, ["Số điện thoại", "phone"])
          ? { phone: getCell(row, ["Số điện thoại", "phone"]) }
          : {}),
        ...(getCell(row, ["Lớp", "className"])
          ? { className: getCell(row, ["Lớp", "className"]) }
          : {}),
        placement: {
          cohortId,
          groupCode: group as StudentPlacement["groupCode"],
          currentAcademicPeriodId,
          ...(entryAcademicPeriodId !== undefined ? { entryAcademicPeriodId } : {}),
        },
        courseResults: [],
      },
    };
  });
  const results = parseCourseResultImportWorkbook(book, catalogs);
  const byCode = new Map(
    students.map((student) => [student.code.trim().toUpperCase(), student]),
  );
  for (const { code, ...result } of results) {
    const student = byCode.get(code.trim().toUpperCase());
    if (!student)
      throw new Error(
        "Bảng điểm có MSSV " +
          code +
          " không thuộc danh sách sinh viên trong tệp.",
      );
    student.academic.courseResults.push(result);
    if (student.academic.courseResults.length > 1000)
      throw new Error("Sinh viên " + code + " có quá 1000 kết quả học tập.");
  }
  return students;
};

const parseNumber = (
  raw: string,
  max: number,
  label: string,
  rowNumber: number,
): number | undefined => {
  if (!raw) return undefined;

  const value = Number(raw.replace(",", "."));

  if (!Number.isFinite(value) || value < 0 || value > max || Math.abs(value * 100 - Math.round(value * 100)) > 1e-7) {
    throw new Error(`Dòng ${rowNumber}: ${label} phải từ 0 đến ${max}, tối đa 2 chữ số thập phân.`);
  }

  return value;
};

const parseStatus = (raw: string, rowNumber: number): CourseResultStatus => {
  const value = normalize(raw);

  if (["dat", "passed"].includes(value)) {
    return "PASSED";
  }

  if (["khongdat", "failed"].includes(value)) {
    return "FAILED";
  }

  const other: Record<string, CourseResultStatus> = {
    inprogress: "IN_PROGRESS",
    danghoc: "IN_PROGRESS",
    withdrawn: "WITHDRAWN",
    rutmon: "WITHDRAWN",
    recognized: "RECOGNIZED",
    congnhan: "RECOGNIZED",
  };
  if (other[value]) return other[value];
  throw new Error(
    `Dòng ${rowNumber}: Trạng thái phải là PASSED, FAILED, IN_PROGRESS, WITHDRAWN hoặc RECOGNIZED.`,
  );
};

const parseCourseResultImportWorkbook = (
  book: XLSX.WorkBook,
  catalogs: AcademicCatalogs,
): (StudentCourseResult & { code: string })[] => {

  const rows = readRows(book, "Kết quả học tập", true);

  const seen = new Set<string>();

  return rows.map((row, index) => {
    const number = index + 2;

    const code = getCell(row, ["Mã sinh viên", "MSSV", "code"]);

    const courseCode = getCell(row, ["Mã môn", "courseCode"]);

    const period = getCell(row, ['Học kỳ ghi nhận', "Kỳ học", "academicPeriodId"]);

    if (!code || !courseCode || !period) {
      throw new Error(`Dòng ${number}: Thiếu MSSV, mã môn hoặc kỳ học.`);
    }

    const academicPeriodId = resolveOption(
      period,
      catalogs.periods,
      "kỳ học",
      number,
    );

    const status = parseStatus(getCell(row, ["Trạng thái", "status"]), number);

    const rawAttempt = getCell(row, ["Lần học", "attemptNumber"]);
    const attemptNumber = rawAttempt ? Number(rawAttempt) : 1;
    if (
      !Number.isInteger(attemptNumber) ||
      attemptNumber < 1 ||
      attemptNumber > 100
    )
      throw new Error(`Dòng ${number}: Lần học phải từ 1 đến 100.`);
    const key = [
      code.trim().toUpperCase(),
      courseCode.trim().toUpperCase(),
      academicPeriodId,
      attemptNumber,
    ].join("|");

    if (seen.has(key)) {
      throw new Error(`Dòng ${number}: Trùng môn, kỳ và lần học.`);
    }

    seen.add(key);

    const score = parseNumber(
      getCell(row, ["Điểm số", "score"]),
      10,
      "Điểm số",
      number,
    );

    const gradePoints = parseNumber(
      getCell(row, ["Điểm hệ 4", "gradePoints"]),
      4,
      "Điểm hệ 4",
      number,
    );

    const grade = getCell(row, ["Điểm chữ", "grade"]);
    const sourceReference = getCell(row, ['Nguồn dữ liệu', 'sourceReference']);
    if (courseCode.length > 20) throw new Error(`Dòng ${number}: Mã môn tối đa 20 ký tự.`);
    if (sourceReference.length > 200) throw new Error(`Dòng ${number}: Nguồn dữ liệu tối đa 200 ký tự.`);
    if(grade.length>2)throw new Error(`Dòng ${number}: Điểm chữ tối đa 2 ký tự.`);
    if(status==='IN_PROGRESS'&&(score!==undefined||gradePoints!==undefined||grade))throw new Error(`Dòng ${number}: Môn đang học phải để trống điểm.`);
    if(status==='RECOGNIZED'&&(score!==undefined||gradePoints!==undefined))throw new Error(`Dòng ${number}: Môn được công nhận không có điểm GPA.`);

    return {
      code,
      courseCode,
      academicPeriodId,
      status,
      attemptNumber,
      ...(getCell(row, ["Nguồn dữ liệu", "sourceReference"])
        ? {
            sourceReference: getCell(row, ["Nguồn dữ liệu", "sourceReference"]),
          }
        : {}),
      ...(score !== undefined ? { score } : {}),
      ...(gradePoints !== undefined ? { gradePoints } : {}),
      ...(grade ? { grade } : {}),
    };
  });
};
