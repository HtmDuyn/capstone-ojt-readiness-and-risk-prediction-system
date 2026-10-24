import type { AcademicCatalogs, CatalogOption } from '@/types/education/import.types';

import * as XLSX from "xlsx";

import type { CourseResultStatus, StudentAcademicStatus, StudentCourseResult, StudentImportRow, StudentPlacement } from '@/types/education/import.types';

type DataObject = Record<string, unknown>;

export const STUDENT_STATUS_LABELS: Record<StudentAcademicStatus, string> = {
  ACTIVE: 'Đang học', INACTIVE: 'Không hoạt động', SUSPENDED: 'Tạm ngưng', GRADUATED: 'Đã tốt nghiệp', DROPPED_OUT: 'Đã thôi học',
};

export const STUDENT_IMPORT_COLUMNS = [
  'Mã sinh viên', 'Họ và tên', 'Email', 'Số điện thoại', 'Lớp',
  'Chương trình đào tạo', 'Trạng thái sinh viên', 'Khóa', 'Nhóm',
  'Kỳ bắt đầu chuyên ngành', 'Kỳ hiện tại',
];
export const COURSE_RESULT_COLUMNS = [
  'Mã sinh viên', 'Mã môn', 'Kỳ học', 'Lần học', 'Trạng thái',
  'Điểm số', 'Điểm hệ 4', 'Điểm chữ', 'Nguồn dữ liệu',
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
  file: File,
  sheetName: string,
  optional = false,
): Promise<DataObject[]> =>
  file.arrayBuffer().then((buffer) => {
    const book = XLSX.read(buffer, { type: "array" });

    const name =
      book.SheetNames.find(
        (item) => normalize(item) === normalize(sheetName),
      ) ??
      (!optional && book.SheetNames.length === 1
        ? book.SheetNames[0]
        : undefined);

    if (!name) {
      if (optional) {
        const extra=book.SheetNames.filter(name=>!['danhsachsinhvien','huongdan','danhmuc'].includes(normalize(name)));
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
      ? [...STUDENT_IMPORT_COLUMNS, 'MSSV', 'code', 'Họ tên', 'fullName', 'phone', 'className', 'programId', 'programName', 'status', 'studentStatus', 'cohortId', 'cohortCode', 'groupCode', 'Kỳ nhập học chuyên ngành', 'Kỳ nhập học', 'entryAcademicPeriodId', 'currentAcademicPeriodId']
      : [...COURSE_RESULT_COLUMNS, 'MSSV', 'code', 'courseCode', 'academicPeriodId', 'attemptNumber', 'status', 'score', 'gradePoints', 'grade', 'sourceReference'];
    const supported = new Set(aliases.map(normalize));
    const unknown = [...new Set(data.flatMap(row => Object.keys(row).filter(key => !supported.has(normalize(key)) && text(row[key]) !== '')))];
    if (unknown.length) throw new Error(`Sheet ${sheetName}: cột chưa được API import hỗ trợ hoặc sai tên: ${unknown.join(', ')}. Hãy dùng mẫu chuẩn để tránh bỏ sót dữ liệu.`);

    if (!data.length) {
      if (optional) return [];
      throw new Error(`Sheet "${sheetName}" chưa có dữ liệu.`);
    }

    return data;
  });

export const createStudentImportWorkbook = (catalogs?: AcademicCatalogs | null): XLSX.WorkBook => {
  const book = XLSX.utils.book_new();
  const sheets: [string, string[]][] = [
    [
      "Danh sách sinh viên",
      STUDENT_IMPORT_COLUMNS,
    ],
    [
      "Kết quả học tập",
      COURSE_RESULT_COLUMNS,
    ],
  ];
  for (const [name, headers] of sheets) {
    const sheet = XLSX.utils.aoa_to_sheet([headers]);
    sheet["!cols"] = headers.map(() => ({ wch: 24 }));
    sheet['!autofilter'] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: 0, c: headers.length - 1 } }) };
    // Text cells preserve leading zeroes in student codes and phone numbers.
    const textColumns = name === 'Danh sách sinh viên' ? headers.map((_, i) => i) : [0, 1, 2, 4, 7, 8];
    for (let r = 1; r <= (name === 'Danh sách sinh viên' ? 500 : 1000); r++) {
      for (const c of textColumns) sheet[XLSX.utils.encode_cell({ r, c })] = { t: 's', v: '', z: '@' };
    }
    sheet['!ref'] = XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: name === 'Danh sách sinh viên' ? 500 : 1000, c: headers.length - 1 } });
    XLSX.utils.book_append_sheet(book, sheet, name);
  }
  XLSX.utils.book_append_sheet(
    book,
    XLSX.utils.aoa_to_sheet([
      ['Sheet', 'Cột / nội dung', 'Bắt buộc', 'Quy tắc nhập'],
      ['Chung', 'Một tệp nhập sinh viên và bảng điểm', '', 'Mỗi sinh viên một dòng ở Danh sách sinh viên; mỗi lần học một dòng ở Kết quả học tập. Tối đa 500 sinh viên, 1.000 kết quả/sinh viên, file tối đa 8 MB.'],
      ['Danh sách sinh viên', 'Mã sinh viên', 'Có', 'Không trùng; tối đa 20 ký tự, chỉ chữ, số, gạch dưới hoặc gạch nối. Định dạng văn bản.'],
      ['Danh sách sinh viên', 'Họ và tên', 'Có', 'Tối đa 150 ký tự.'],
      ['Danh sách sinh viên', 'Email', 'Có', 'Email đăng nhập, tối đa 100 ký tự; không trùng trong tệp hoặc với tài khoản khác.'],
      ['Danh sách sinh viên', 'Số điện thoại', 'Không', 'Tối đa 20 ký tự; giữ định dạng văn bản để không mất số 0 đầu. Để trống thì giữ dữ liệu đang có.'],
      ['Danh sách sinh viên', 'Lớp', 'Không', 'Tối đa 20 ký tự. Để trống thì giữ dữ liệu đang có.'],
      ['Danh sách sinh viên', 'Chương trình đào tạo', 'Có', 'Nhập ID, mã hoặc tên có trong sheet Danh mục. Chuyên ngành được suy ra từ chương trình.'],
      ['Danh sách sinh viên', 'Trạng thái sinh viên', 'Không', 'ACTIVE (đang học), INACTIVE, SUSPENDED, GRADUATED, DROPPED_OUT. Để trống: sinh viên mới ACTIVE; sinh viên cũ giữ trạng thái. Đây là trạng thái học vụ, không phải khóa/mở tài khoản.'],
      ['Danh sách sinh viên', 'Khóa', 'Có', 'Nhập ID hoặc mã/tên khóa trong Danh mục. Năm nhập học được lấy từ cấu hình khóa.'],
      ['Danh sách sinh viên', 'Nhóm', 'Có', 'Chỉ A, B, C hoặc D; nhóm phải được cấu hình trong khóa.'],
      ['Danh sách sinh viên', 'Kỳ bắt đầu chuyên ngành', 'Không', 'ID/mã/tên học kỳ thường. Để trống: lấy kỳ vào của nhóm khi mới nhập/đổi nhóm, hoặc giữ kỳ đã gán cho sinh viên cũ. Không chọn Block 3.'],
      ['Danh sách sinh viên', 'Kỳ hiện tại', 'Có', 'ID/mã/tên kỳ thực tế, có thể là học kỳ thường hoặc Block 3. Không sớm hơn kỳ bắt đầu chuyên ngành.'],
      ['Kết quả học tập', 'Mã sinh viên', 'Có trên mỗi dòng điểm', 'Phải tồn tại trong sheet Danh sách sinh viên của cùng tệp.'],
      ['Kết quả học tập', 'Mã môn', 'Có trên mỗi dòng điểm', 'Mã môn đã tồn tại trong danh mục môn của hệ thống, tối đa 20 ký tự.'],
      ['Kết quả học tập', 'Kỳ học', 'Có trên mỗi dòng điểm', 'ID/mã/tên kỳ có trong Danh mục và phù hợp lộ trình sinh viên.'],
      ['Kết quả học tập', 'Lần học', 'Không', 'Số nguyên 1–100, mặc định 1. Không trùng tổ hợp MSSV + môn + kỳ + lần học.'],
      ['Kết quả học tập', 'Trạng thái', 'Có trên mỗi dòng điểm', 'PASSED, FAILED, IN_PROGRESS, WITHDRAWN hoặc RECOGNIZED. Có thể nhập Đạt, Không đạt, Đang học, Rút môn, Công nhận.'],
      ['Kết quả học tập', 'Điểm số', 'Không', 'Từ 0–10, tối đa 2 chữ số thập phân; không nhập khi RECOGNIZED.'],
      ['Kết quả học tập', 'Điểm hệ 4', 'Không', 'Từ 0–4, tối đa 2 chữ số thập phân; không nhập khi RECOGNIZED.'],
      ['Kết quả học tập', 'Điểm chữ', 'Không', 'Tối đa 2 ký tự, ví dụ A, B+, C.'],
      ['Kết quả học tập', 'Nguồn dữ liệu', 'Không', 'Mã/chứng từ tham chiếu, tối đa 200 ký tự.'],
      ['Chung', 'Sinh viên chưa có bảng điểm', '', 'Để trống sheet Kết quả học tập; hệ thống vẫn nhập hồ sơ sinh viên.'],
      ['Tự động', 'Không nhập tay', '', 'StudentID, UserID, Username, mật khẩu/PasswordHash, RoleID, thời gian tạo/cập nhật, người ghi nhận và lịch sử do hệ thống tạo.'],
      ['Tự động', 'Dữ liệu tính toán', '', 'Năm nhập học, kỳ chuyên ngành thứ mấy, GPA, tín chỉ tích lũy, số môn còn rớt và điều kiện OJT được hệ thống lấy từ cấu hình hoặc tính từ bảng điểm.'],
      ['Phạm vi', 'Hồ sơ mở rộng', '', 'CV, nguyện vọng nghề nghiệp, chọn combo và đăng ký OJT thuộc các luồng riêng; API import sinh viên và bảng điểm không nhận các dữ liệu này. DB hiện không có trường ngày sinh/giới tính/địa chỉ trong Users hoặc Students để nhập tại đây.'],
      ['Chung', 'Cập nhật dữ liệu đã có', '', 'Mã sinh viên và email phải khớp danh tính hiện có. Điểm đã lưu khác dữ liệu nhập phải dùng luồng hiệu chỉnh có lý do; import không tự ghi đè bảng điểm cũ.'],
      ['Chung', 'Danh mục', '', catalogs ? 'Danh mục được lấy tại thời điểm tải mẫu. Khi dữ liệu hệ thống đổi, tải mẫu/danh mục mới.' : 'Chưa tải được danh mục. Hãy tải lại danh mục trên trang và tải mẫu mới để có ID/mã hợp lệ.'],
    ]),
    "Hướng dẫn",
  );
  book.Sheets['Hướng dẫn']['!cols'] = [{ wch: 24 }, { wch: 34 }, { wch: 26 }, { wch: 110 }];
  const references: (string | number)[][] = [['Danh mục', 'ID', 'Tên hiển thị', 'Mã / tên có thể nhập']];
  for (const [name, options] of [['Chương trình đào tạo', catalogs?.programs], ['Khóa', catalogs?.cohorts], ['Kỳ học', catalogs?.periods]] as const) {
    for (const option of options ?? []) references.push([name, option.id, option.label, option.aliases.join(' | ')]);
  }
  const referenceSheet = XLSX.utils.aoa_to_sheet(references);
  referenceSheet['!cols'] = [{ wch: 28 }, { wch: 12 }, { wch: 44 }, { wch: 85 }];
  XLSX.utils.book_append_sheet(book, referenceSheet, 'Danh mục');
  return book;
};

export const downloadStudentImportTemplate = (catalogs?: AcademicCatalogs | null) =>
  XLSX.writeFile(createStudentImportWorkbook(catalogs), 'mau-import-sinh-vien-va-bang-diem-PDT.xlsx');

export const parseStudentImportWorkbook = async (
  file: File,
  catalogs: AcademicCatalogs,
): Promise<StudentImportRow[]> => {

  const rows = await readRows(file, "Danh sách sinh viên");

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
      getCell(row, ["Kỳ hiện tại", "currentAcademicPeriodId"]),
      catalogs.periods,
      "kỳ hiện tại",
      number,
    );

    const group = getCell(row, ["Nhóm", "groupCode"]).toUpperCase();

    if (!["A", "B", "C", "D"].includes(group)) {
      throw new Error(`Dòng ${number}: Nhóm phải là A, B, C hoặc D.`);
    }
    const entry = getCell(row, ['Kỳ bắt đầu chuyên ngành', 'Kỳ nhập học chuyên ngành', 'Kỳ nhập học', 'entryAcademicPeriodId']);
    const entryAcademicPeriodId = entry ? resolveOption(entry, catalogs.periods, 'kỳ bắt đầu chuyên ngành', number) : undefined;
    if (catalogs.periods.find(period => period.id === entryAcademicPeriodId)?.kind === 'BLOCK3') throw new Error(`Dòng ${number}: Kỳ bắt đầu chuyên ngành phải là học kỳ thường, không phải Block 3.`);
    const rawStatus = getCell(row, ['Trạng thái sinh viên', 'studentStatus', 'status']);
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
  if (students.length > 500)
    throw new Error("Mỗi lần import tối đa 500 sinh viên.");
  const results = await parseCourseResultImportWorkbook(file, catalogs);
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

const parseCourseResultImportWorkbook = async (
  file: File,
  catalogs: AcademicCatalogs,
): Promise<(StudentCourseResult & { code: string })[]> => {

  const rows = await readRows(file, "Kết quả học tập", true);

  const seen = new Set<string>();

  return rows.map((row, index) => {
    const number = index + 2;

    const code = getCell(row, ["Mã sinh viên", "MSSV", "code"]);

    const courseCode = getCell(row, ["Mã môn", "courseCode"]);

    const period = getCell(row, ["Kỳ học", "academicPeriodId"]);

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
