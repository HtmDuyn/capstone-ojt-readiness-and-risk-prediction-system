
import * as XLSX from "xlsx";
import API from "@/service/api";
import type {
  CourseResultImportRow,
  CourseResultStatus,
  StudentImportRow,
  StudentPlacement,
} from "@/service/import.service";

type DataObject = Record<string, unknown>;

export interface CatalogOption {
  id: number;
  label: string;
  aliases: string[];
}

export interface AcademicCatalogs {
  programs: CatalogOption[];
  cohorts: CatalogOption[];
  periods: CatalogOption[];
}

const asObject = (value: unknown): DataObject | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DataObject)
    : null;

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

const extractItems = (
  response: unknown,
  endpoint: string,
): {
  items: DataObject[];
  total?: number;
} => {
  if (Array.isArray(response)) {
    return {
      items: response
        .map(asObject)
        .filter((v): v is DataObject => !!v),
    };
  }

  const outer = asObject(response);

  if (outer?.success === false) {
    throw new Error(
      text(outer.message) || `Không tải được ${endpoint}.`,
    );
  }

  const inner = asObject(outer?.data) ?? outer;

  const rawItems = Array.isArray(inner?.items)
    ? inner.items
    : Array.isArray(inner?.data)
      ? inner.data
      : null;

  if (!rawItems) {
    throw new Error(
      `API ${endpoint} không trả về mảng items hợp lệ.`,
    );
  }

  const totalValue = Number(inner?.total);

  return {
    items: rawItems
      .map(asObject)
      .filter((v): v is DataObject => !!v),
    total:
      Number.isFinite(totalValue) && totalValue >= 0
        ? totalValue
        : undefined,
  };
};

const fetchCatalog = async (
  endpoint: string,
): Promise<DataObject[]> => {
  const result: DataObject[] = [];
  const limit = 100;

  for (let page = 1; page <= 50; page++) {
    // API.post sử dụng baseURL /api.
    const response = await API.post<unknown>(endpoint, {
      page,
      limit,
    });

    const { items, total } = extractItems(
      response.data,
      endpoint,
    );

    result.push(...items);

    if (
      items.length < limit ||
      (total !== undefined && result.length >= total)
    ) {
      return result;
    }
  }

  throw new Error(
    `Danh mục ${endpoint} vượt quá giới hạn 5.000 bản ghi.`,
  );
};

const buildOption = (
  id: number | undefined,
  candidates: unknown[],
): CatalogOption | null => {
  if (!id) return null;

  const aliases = [
    ...new Set(candidates.map(text).filter(Boolean)),
  ];

  return {
    id,
    label: aliases[0] || `ID ${id}`,
    aliases,
  };
};

const uniqueOptions = (
  options: Array<CatalogOption | null>,
): CatalogOption[] => {
  const map = new Map<number, CatalogOption>();

  for (const option of options) {
    if (!option) continue;

    const existing = map.get(option.id);

    if (existing) {
      existing.aliases = [
        ...new Set([...existing.aliases, ...option.aliases]),
      ];
    } else {
      map.set(option.id, option);
    }
  }

  return [...map.values()].sort((a, b) =>
    a.label.localeCompare(b.label, "vi"),
  );
};

export const loadAcademicCatalogs =
  async (): Promise<AcademicCatalogs> => {
    const [curricula, cohorts, periods] = await Promise.all([
      fetchCatalog("/json/curricula/list"),
      fetchCatalog("/json/cohorts/list"),
      fetchCatalog("/json/academic-periods/list"),
    ]);

    const programs = uniqueOptions(
      curricula.map((item) => {
        const program = asObject(item.program);

        // curriculum.id KHÔNG phải programId.
        return buildOption(
          positiveId(item.programId) ??
            positiveId(program?.id),
          [
            program?.name,
            program?.code,
            item.programName,
            item.programCode,
          ],
        );
      }),
    );

    const cohortOptions = uniqueOptions(
      cohorts.map((item) =>
        buildOption(positiveId(item.id), [
          item.cohortCode,
          item.code,
          item.cohortName,
          item.name,
        ]),
      ),
    );

    const periodOptions = uniqueOptions(
      periods.map((item) => {
        const code = text(item.periodCode);

        const readableCode = code.replace(
          /^(FALL|SPRING|SUMMER)(\d{4})$/i,
          (_match, term: string, year: string) =>
            `${term} ${year}`,
        );

        return buildOption(positiveId(item.id), [
          item.name,
          code,
          readableCode,
        ]);
      }),
    );

    if (
      !programs.length ||
      !cohortOptions.length ||
      !periodOptions.length
    ) {
      throw new Error(
        "Thiếu danh mục chương trình, khóa hoặc kỳ học từ Backend. " +
          "Đặc biệt, danh sách CTĐT phải trả về programId hoặc program.id; " +
          "không được dùng curriculum.id thay thế.",
      );
    }

    return {
      programs,
      cohorts: cohortOptions,
      periods: periodOptions,
    };
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
      item.aliases.some(
        (alias) => normalize(alias) === normalize(input),
      ),
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
): Promise<DataObject[]> =>
  file.arrayBuffer().then((buffer) => {
    const book = XLSX.read(buffer, { type: "array" });

    const name =
      book.SheetNames.find(
        (item) => normalize(item) === normalize(sheetName),
      ) ??
      (book.SheetNames.length === 1
        ? book.SheetNames[0]
        : undefined);

    if (!name) {
      throw new Error(
        `Không tìm thấy sheet "${sheetName}".`,
      );
    }

    const sheet = book.Sheets[name];

    if (!sheet) {
      throw new Error(
        `Không đọc được sheet "${sheetName}".`,
      );
    }

    const rows = XLSX.utils.sheet_to_json<DataObject>(
      sheet,
      { defval: "" },
    );

    const data = rows.filter((row) =>
      Object.values(row).some((v) => text(v) !== ""),
    );

    if (!data.length) {
      throw new Error(
        `Sheet "${sheetName}" chưa có dữ liệu.`,
      );
    }

    return data;
  });

const createTemplate = (
  name: string,
  sheetName: string,
  headers: string[],
) => {
  const book = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([headers]);

  sheet["!cols"] = headers.map(() => ({ wch: 26 }));

  XLSX.utils.book_append_sheet(
    book,
    sheet,
    sheetName,
  );

  const guide = XLSX.utils.aoa_to_sheet([
    ["HƯỚNG DẪN"],
    ["Nhập dữ liệu vào sheet đầu tiên, mỗi dòng là một bản ghi."],
    ["Các trường chương trình, khóa và kỳ: nhập ID hoặc mã/tên có trong danh mục Backend."],
    ["Không dùng ID ví dụ hoặc ID tự đặt."],
    ["Nhóm sinh viên chỉ nhận A, B, C hoặc D."],
    ["Không có bảng điểm thì sinh viên mới được gửi courseResults: []."],
  ]);

  guide["!cols"] = [{ wch: 90 }];

  XLSX.utils.book_append_sheet(
    book,
    guide,
    "Hướng dẫn",
  );

  XLSX.writeFile(book, name);
};

export const downloadStudentImportTemplate = () =>
  createTemplate(
    "mau-import-sinh-vien-PDT.xlsx",
    "Danh sách sinh viên",
    [
      "Mã sinh viên",
      "Họ và tên",
      "Email",
      "Chương trình đào tạo",
      "Khóa",
      "Nhóm",
      "Kỳ hiện tại",
    ],
  );

export const downloadCourseResultImportTemplate = () =>
  createTemplate(
    "mau-import-ket-qua-hoc-tap-PDT.xlsx",
    "Kết quả học tập",
    [
      "Mã sinh viên",
      "Mã môn",
      "Kỳ học",
      "Trạng thái",
      "Điểm số",
      "Điểm hệ 4",
      "Điểm chữ",
    ],
  );

export const parseStudentImportWorkbook = async (
  file: File,
  providedCatalogs?: AcademicCatalogs,
): Promise<StudentImportRow[]> => {
  const catalogs =
    providedCatalogs ?? (await loadAcademicCatalogs());

  const rows = await readRows(
    file,
    "Danh sách sinh viên",
  );

  const seen = new Set<string>();

  return rows.map((row, index) => {
    const number = index + 2;

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

    const email = getCell(row, ["Email"]);

    if (!code || !fullName || !email) {
      throw new Error(
        `Dòng ${number}: Thiếu MSSV, họ tên hoặc email.`,
      );
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error(
        `Dòng ${number}: Email không hợp lệ.`,
      );
    }

    if (seen.has(normalize(code))) {
      throw new Error(
        `Dòng ${number}: Trùng MSSV ${code}.`,
      );
    }

    seen.add(normalize(code));

    const programId = resolveOption(
      getCell(row, [
        "Chương trình đào tạo",
        "programId",
        "programName",
      ]),
      catalogs.programs,
      "chương trình đào tạo",
      number,
    );

    const cohortId = resolveOption(
      getCell(row, [
        "Khóa",
        "cohortId",
        "cohortCode",
      ]),
      catalogs.cohorts,
      "khóa",
      number,
    );

    const currentAcademicPeriodId = resolveOption(
      getCell(row, [
        "Kỳ hiện tại",
        "currentAcademicPeriodId",
      ]),
      catalogs.periods,
      "kỳ hiện tại",
      number,
    );

    const group = getCell(row, [
      "Nhóm",
      "groupCode",
    ]).toUpperCase();

    if (!["A", "B", "C", "D"].includes(group)) {
      throw new Error(
        `Dòng ${number}: Nhóm phải là A, B, C hoặc D.`,
      );
    }

    return {
      code,
      fullName,
      email,
      academic: {
        programId,
        placement: {
          cohortId,
          groupCode:
            group as StudentPlacement["groupCode"],
          currentAcademicPeriodId,
        },
        courseResults: [],
      },
    };
  });
};

const parseNumber = (
  raw: string,
  max: number,
  label: string,
  rowNumber: number,
): number | undefined => {
  if (!raw) return undefined;

  const value = Number(raw.replace(",", "."));

  if (
    !Number.isFinite(value) ||
    value < 0 ||
    value > max
  ) {
    throw new Error(
      `Dòng ${rowNumber}: ${label} phải từ 0 đến ${max}.`,
    );
  }

  return value;
};

const parseStatus = (
  raw: string,
  rowNumber: number,
): CourseResultStatus => {
  const value = normalize(raw);

  if (["dat", "passed"].includes(value)) {
    return "PASSED";
  }

  if (["khongdat", "failed"].includes(value)) {
    return "FAILED";
  }

  throw new Error(
    `Dòng ${rowNumber}: Trạng thái phải là Đạt hoặc Không đạt.`,
  );
};

export const parseCourseResultImportWorkbook = async (
  file: File,
  providedCatalogs?: AcademicCatalogs,
): Promise<CourseResultImportRow[]> => {
  const catalogs =
    providedCatalogs ?? (await loadAcademicCatalogs());

  const rows = await readRows(
    file,
    "Kết quả học tập",
  );

  const seen = new Set<string>();

  return rows.map((row, index) => {
    const number = index + 2;

    const code = getCell(row, [
      "Mã sinh viên",
      "MSSV",
      "code",
    ]);

    const courseCode = getCell(row, [
      "Mã môn",
      "courseCode",
    ]);

    const period = getCell(row, [
      "Kỳ học",
      "academicPeriodId",
    ]);

    if (!code || !courseCode || !period) {
      throw new Error(
        `Dòng ${number}: Thiếu MSSV, mã môn hoặc kỳ học.`,
      );
    }

    const academicPeriodId = resolveOption(
      period,
      catalogs.periods,
      "kỳ học",
      number,
    );

    const status = parseStatus(
      getCell(row, ["Trạng thái", "status"]),
      number,
    );

    const key = [
      normalize(code),
      normalize(courseCode),
      academicPeriodId,
    ].join("|");

    if (seen.has(key)) {
      throw new Error(
        `Dòng ${number}: Trùng môn trong cùng kỳ.`,
      );
    }

    seen.add(key);

    const score = parseNumber(
      getCell(row, ["Điểm số", "score"]),
      10,
      "Điểm số",
      number,
    );

    const gradePoints = parseNumber(
      getCell(row, [
        "Điểm hệ 4",
        "gradePoints",
      ]),
      4,
      "Điểm hệ 4",
      number,
    );

    const grade = getCell(row, [
      "Điểm chữ",
      "grade",
    ]);

    return {
      code,
      courseCode,
      academicPeriodId,
      status,
      ...(score !== undefined ? { score } : {}),
      ...(gradePoints !== undefined
        ? { gradePoints }
        : {}),
      ...(grade ? { grade } : {}),
    };
  });
};
