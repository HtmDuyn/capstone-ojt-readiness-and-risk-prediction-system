
import * as XLSX from "xlsx";

import API from "@/service/api";
import type {
  StudentAcademicData,
  StudentCourseResult,
  StudentImportRow,
} from "@/service/import.service";

type RecordData = Record<string, unknown>;

const asRecord = (value: unknown): RecordData | null =>
  value !== null &&
  typeof value === "object" &&
  !Array.isArray(value)
    ? (value as RecordData)
    : null;

const toText = (value: unknown): string =>
  value === null || value === undefined
    ? ""
    : String(value).trim();

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/đ/g, "d")
    .replace(/Đ/g, "D")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const getCell = (
  row: RecordData,
  aliases: string[],
): string => {
  const expected = aliases.map(normalize);

  for (const [key, value] of Object.entries(row)) {
    if (expected.includes(normalize(key))) {
      return toText(value);
    }
  }

  return "";
};

const positiveId = (value: unknown): number | undefined => {
  if (value === "" || value === null || value === undefined) {
    return undefined;
  }

  const number = Number(value);

  return Number.isInteger(number) && number > 0
    ? number
    : undefined;
};

const directId = (
  raw: string,
  label: string,
  rowNumber: number,
): number | undefined => {
  if (!raw) return undefined;

  const id = positiveId(raw);

  if (!id) {
    throw new Error(
      `Dòng ${rowNumber}: ${label} phải là ID hợp lệ.`,
    );
  }

  return id;
};

const optionalNumber = (
  raw: string,
  label: string,
  rowNumber: number,
): number | undefined => {
  if (!raw) return undefined;

  const number = Number(raw.replace(",", "."));

  if (!Number.isFinite(number)) {
    throw new Error(
      `Dòng ${rowNumber}: ${label} không phải là số hợp lệ.`,
    );
  }

  return number;
};

const hasData = (row: RecordData): boolean =>
  Object.values(row).some((value) => toText(value) !== "");

const readSheet = (
  sheet?: XLSX.WorkSheet,
): RecordData[] =>
  sheet
    ? XLSX.utils
        .sheet_to_json<RecordData>(sheet, { defval: "" })
        .filter(hasData)
    : [];

/* =====================================================
   LẤY DANH MỤC TỪ BACKEND
   ===================================================== */

const fetchCatalog = async (
  endpoint: string,
): Promise<RecordData[]> => {
  const all: RecordData[] = [];
  const limit = 100;

  for (let page = 1; page <= 50; page++) {
    const response = await API.get<unknown>(endpoint, {
      params: { page, limit },
    });

    const raw = response.data;

    if (Array.isArray(raw)) {
      return raw.map(asRecord).filter(
        (item): item is RecordData => item !== null,
      );
    }

    const outer = asRecord(raw);

    if (outer?.success === false) {
      throw new Error(
        toText(outer.message) ||
          `Không thể tải danh mục ${endpoint}.`,
      );
    }

    const content = outer?.data ?? raw;

    if (Array.isArray(content)) {
      return content.map(asRecord).filter(
        (item): item is RecordData => item !== null,
      );
    }

    const result = asRecord(content);

    if (!Array.isArray(result?.items)) {
      throw new Error(
        `API ${endpoint} trả về danh sách không đúng định dạng.`,
      );
    }

    const items = result.items
      .map(asRecord)
      .filter(
        (item): item is RecordData => item !== null,
      );

    all.push(...items);

    const total = Number(result.total);
    const actualLimit =
      positiveId(result.limit) ?? limit;

    if (
      items.length === 0 ||
      items.length < actualLimit ||
      (Number.isFinite(total) && all.length >= total)
    ) {
      return all;
    }
  }

  throw new Error(
    `Không thể tải đầy đủ danh mục ${endpoint}.`,
  );
};

/* =====================================================
   ÁNH XẠ TÊN / MÃ THÀNH ID
   ===================================================== */

const findUniqueId = (
  input: string,
  items: RecordData[],
  getLabels: (item: RecordData) => string[],
  getId: (item: RecordData) => number | undefined,
  label: string,
  rowNumber: number,
): number => {
  const matching = items.filter((item) =>
    getLabels(item).some(
      (candidate) =>
        candidate !== "" &&
        normalize(candidate) === normalize(input),
    ),
  );

  if (matching.length === 0) {
    throw new Error(
      `Dòng ${rowNumber}: Không tìm thấy ${label} "${input}" trong hệ thống.`,
    );
  }

  const ids = [
    ...new Set(
      matching
        .map(getId)
        .filter(
          (id): id is number => id !== undefined,
        ),
    ),
  ];

  if (ids.length !== 1) {
    throw new Error(
      `Dòng ${rowNumber}: Không xác định được ID duy nhất cho ${label} "${input}".`,
    );
  }

  return ids[0];
};

const programIdFromCurriculum = (
  item: RecordData,
): number | undefined => {
  const program = asRecord(item.program);

  // Không tự lấy curriculum.id làm programId.
  return (
    positiveId(item.programId) ??
    positiveId(program?.id)
  );
};

const programLabels = (item: RecordData): string[] => {
  const program = asRecord(item.program);

  return [
    toText(item.programCode),
    toText(item.programName),
    toText(item.code),
    toText(item.name),
    toText(program?.code),
    toText(program?.name),
  ];
};

const cohortLabels = (item: RecordData): string[] => [
  toText(item.cohortCode),
  toText(item.cohortName),
  toText(item.code),
  toText(item.name),
];

const periodLabels = (item: RecordData): string[] => {
  const periodCode = toText(item.periodCode);

  const readableCode = periodCode.replace(
    /^(FALL|SPRING|SUMMER)(\d{4})$/i,
    (_match, term: string, year: string) =>
      `${term} ${year}`,
  );

  return [
    periodCode,
    readableCode,
    toText(item.name),
  ];
};

/* =====================================================
   TẠO FILE EXCEL MẪU
   ===================================================== */

export const downloadStudentImportTemplate = (): void => {
  const workbook = XLSX.utils.book_new();

  const studentHeaders = [
    "Mã sinh viên",
    "Họ và tên",
    "Email",
    "Chương trình đào tạo",
    "Khóa",
    "Nhóm",
    "Kỳ hiện tại",
  ];

  const resultHeaders = [
    "Mã sinh viên",
    "Mã môn",
    "Kỳ học",
    "Trạng thái",
    "Điểm số",
    "Điểm hệ 4",
    "Điểm chữ",
  ];

  const studentSheet =
    XLSX.utils.aoa_to_sheet([studentHeaders]);

studentSheet["!cols"] = [
  { wch: 19 },
  { wch: 28 },
  { wch: 35 },
  { wch: 32 },
  { wch: 18 },
  { wch: 15 },
  { wch: 23 },
];

  const resultSheet =
    XLSX.utils.aoa_to_sheet([resultHeaders]);

  resultSheet["!cols"] = [
    { wch: 19 },
    { wch: 19 },
    { wch: 23 },
    { wch: 20 },
    { wch: 17 },
    { wch: 17 },
    { wch: 17 },
  ];

  XLSX.utils.book_append_sheet(
    workbook,
    studentSheet,
    "Danh sách sinh viên",
  );

  XLSX.utils.book_append_sheet(
    workbook,
    resultSheet,
    "Kết quả học tập",
  );

  XLSX.writeFile(
    workbook,
    "mau-import-sinh-vien-PDT.xlsx",
  );
};

/* =====================================================
   ĐỌC EXCEL VÀ CHUYỂN SANG PAYLOAD API
   ===================================================== */

export const parseStudentImportWorkbook = async (
  file: File,
): Promise<StudentImportRow[]> => {
  const buffer = await file.arrayBuffer();

  const workbook = XLSX.read(buffer, {
    type: "array",
  });

  const studentSheetName =
    workbook.SheetNames.find(
      (name) =>
        normalize(name) ===
        normalize("Danh sách sinh viên"),
    ) ?? workbook.SheetNames[0];

  if (!studentSheetName) {
    throw new Error("File không có sheet dữ liệu sinh viên.");
  }

  const resultSheetName = workbook.SheetNames.find(
    (name) =>
      normalize(name) ===
      normalize("Kết quả học tập"),
  );

  const studentRows = readSheet(
    workbook.Sheets[studentSheetName],
  );

  const resultRows = readSheet(
    resultSheetName
      ? workbook.Sheets[resultSheetName]
      : undefined,
  );

  if (studentRows.length === 0) {
    throw new Error(
      "Sheet Danh sách sinh viên chưa có dữ liệu.",
    );
  }

  // Chỉ tải danh mục khi Excel có nhập tên/mã cần ánh xạ.
  const needsPrograms = studentRows.some((row) =>
    getCell(row, ["Chương trình đào tạo", "programName"]),
  );

  const needsCohorts = studentRows.some((row) =>
    getCell(row, ["Khóa", "cohortCode"]),
  );

  const needsPeriods =
    studentRows.some((row) =>
      getCell(row, ["Kỳ hiện tại"]),
    ) ||
    resultRows.some((row) =>
      getCell(row, ["Kỳ học"]),
    );

  const [programs, cohorts, periods] = await Promise.all([
    needsPrograms
      ? fetchCatalog("/curricula")
      : Promise.resolve([]),
    needsCohorts
      ? fetchCatalog("/cohorts")
      : Promise.resolve([]),
    needsPeriods
      ? fetchCatalog("/academic-periods")
      : Promise.resolve([]),
  ]);

  const students: StudentImportRow[] = [];
  const studentMap = new Map<string, StudentImportRow>();

  /* =====================
     SHEET SINH VIÊN
     ===================== */

  studentRows.forEach((row, index) => {
    const rowNumber = index + 2;

    const code = getCell(row, [
      "Mã sinh viên",
      "MSSV",
      "code",
    ]);

    const fullName = getCell(row, [
      "Họ và tên",
      "Họ tên",
      "fullName",
    ]);

    const email = getCell(row, [
      "Email",
      "email",
    ]);

    if (!code || !fullName || !email) {
      throw new Error(
        `Sheet Danh sách sinh viên, dòng ${rowNumber}: Thiếu MSSV, họ tên hoặc email.`,
      );
    }

    const key = code.toLowerCase();

    if (studentMap.has(key)) {
      throw new Error(
        `MSSV "${code}" xuất hiện nhiều lần trong sheet Danh sách sinh viên.`,
      );
    }

    const programName = getCell(row, [
      "Chương trình đào tạo",
      "programName",
    ]);

    const cohortName = getCell(row, [
      "Khóa",
      "cohortCode",
    ]);

    const periodName = getCell(row, [
      "Kỳ hiện tại",
    ]);

    const groupCode = getCell(row, [
      "Nhóm",
      "groupCode",
    ]);

    const programId =
      directId(
        getCell(row, ["programId"]),
        "programId",
        rowNumber,
      ) ??
      (programName
        ? findUniqueId(
            programName,
            programs,
            programLabels,
            programIdFromCurriculum,
            "chương trình đào tạo",
            rowNumber,
          )
        : undefined);

    const cohortId =
      directId(
        getCell(row, ["cohortId"]),
        "cohortId",
        rowNumber,
      ) ??
      (cohortName
        ? findUniqueId(
            cohortName,
            cohorts,
            cohortLabels,
            (item) => positiveId(item.id),
            "khóa học",
            rowNumber,
          )
        : undefined);

    const currentAcademicPeriodId =
      directId(
        getCell(row, ["currentAcademicPeriodId"]),
        "currentAcademicPeriodId",
        rowNumber,
      ) ??
      (periodName
        ? findUniqueId(
            periodName,
            periods,
            periodLabels,
            (item) => positiveId(item.id),
            "kỳ học",
            rowNumber,
          )
        : undefined);

    const academic: StudentAcademicData = {};

    if (programId !== undefined) {
      academic.programId = programId;
    }

    if (
      cohortId !== undefined ||
      groupCode ||
      currentAcademicPeriodId !== undefined
    ) {
      academic.placement = {};

      if (cohortId !== undefined) {
        academic.placement.cohortId = cohortId;
      }

      if (groupCode) {
        academic.placement.groupCode = groupCode;
      }

      if (currentAcademicPeriodId !== undefined) {
        academic.placement.currentAcademicPeriodId =
          currentAcademicPeriodId;
      }
    }

    const student: StudentImportRow = {
      code,
      email,
      fullName,
      ...(Object.keys(academic).length > 0
        ? { academic }
        : {}),
    };

    students.push(student);
    studentMap.set(key, student);
  });

  /* =====================
     SHEET KẾT QUẢ HỌC TẬP
     ===================== */

  const usedCourseKeys = new Set<string>();

  resultRows.forEach((row, index) => {
    const rowNumber = index + 2;

    const code = getCell(row, [
      "Mã sinh viên",
      "MSSV",
      "code",
    ]);

    const courseCode = getCell(row, [
      "Mã môn",
      "courseCode",
    ]);

    const periodName = getCell(row, [
      "Kỳ học",
    ]);

    const rawStatus = getCell(row, [
      "Trạng thái",
      "status",
    ]);

    if (!code || !courseCode || !rawStatus) {
      throw new Error(
        `Sheet Kết quả học tập, dòng ${rowNumber}: Thiếu MSSV, mã môn hoặc trạng thái.`,
      );
    }

    const student = studentMap.get(
      code.toLowerCase(),
    );

    if (!student) {
      throw new Error(
        `Sheet Kết quả học tập, dòng ${rowNumber}: MSSV "${code}" không có trong sheet Danh sách sinh viên.`,
      );
    }

    const academicPeriodId =
      directId(
        getCell(row, ["academicPeriodId"]),
        "academicPeriodId",
        rowNumber,
      ) ??
      (periodName
        ? findUniqueId(
            periodName,
            periods,
            periodLabels,
            (item) => positiveId(item.id),
            "kỳ học",
            rowNumber,
          )
        : undefined);

    if (academicPeriodId === undefined) {
      throw new Error(
        `Sheet Kết quả học tập, dòng ${rowNumber}: Chưa nhập kỳ học.`,
      );
    }

    let status: string;

    const normalizedStatus = normalize(rawStatus);

    if (
      normalizedStatus === "dat" ||
      normalizedStatus === "passed"
    ) {
      status = "PASSED";
    } else if (
      normalizedStatus === "khongdat" ||
      normalizedStatus === "failed"
    ) {
      status = "FAILED";
    } else {
      throw new Error(
        `Sheet Kết quả học tập, dòng ${rowNumber}: Trạng thái "${rawStatus}" chưa được hỗ trợ.`,
      );
    }

    const courseKey = [
      code.toLowerCase(),
      courseCode.toLowerCase(),
      academicPeriodId,
    ].join("|");

    if (usedCourseKeys.has(courseKey)) {
      throw new Error(
        `Sheet Kết quả học tập, dòng ${rowNumber}: Trùng môn ${courseCode} trong cùng kỳ.`,
      );
    }

    usedCourseKeys.add(courseKey);

    const result: StudentCourseResult = {
      courseCode,
      academicPeriodId,
      status,
    };

    const score = optionalNumber(
      getCell(row, ["Điểm số", "score"]),
      "Điểm số",
      rowNumber,
    );

    const gradePoints = optionalNumber(
      getCell(row, ["Điểm hệ 4", "gradePoints"]),
      "Điểm hệ 4",
      rowNumber,
    );

    const grade = getCell(row, [
      "Điểm chữ",
      "grade",
    ]);

    if (score !== undefined) {
      result.score = score;
    }

    if (gradePoints !== undefined) {
      result.gradePoints = gradePoints;
    }

    if (grade) {
      result.grade = grade;
    }

    if (!student.academic) {
      student.academic = {};
    }

    if (!student.academic.courseResults) {
      student.academic.courseResults = [];
    }

    student.academic.courseResults.push(result);
  });

  return students;
};
