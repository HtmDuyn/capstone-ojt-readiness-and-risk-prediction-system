import type { AcademicCatalogs, CatalogOption } from '@/types/education/import.types';
import { getAllItems } from './educationApi';

type DataObject = Record<string, unknown>;

const asObject = (value: unknown): DataObject | null =>
  value !== null && typeof value === "object" && !Array.isArray(value)
    ? (value as DataObject)
    : null;

const text = (value: unknown): string =>
  value === undefined || value === null ? "" : String(value).trim();

const positiveId = (value: unknown): number | undefined => {
  const raw = text(value);
  if (!raw) return undefined;

  const id = Number(raw);
  return Number.isSafeInteger(id) && id > 0 ? id : undefined;
};

const fetchCatalog = (endpoint: string): Promise<DataObject[]> =>
  getAllItems<DataObject>(endpoint);

const buildOption = (
  id: number | undefined,
  candidates: unknown[],
): CatalogOption | null => {
  if (!id) return null;

  const aliases = [...new Set(candidates.map(text).filter(Boolean))];

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
      existing.aliases = [...new Set([...existing.aliases, ...option.aliases])];
    } else {
      map.set(option.id, option);
    }
  }

  return [...map.values()].sort((a, b) => a.label.localeCompare(b.label, "vi"));
};

export const loadAcademicCatalogs = async (): Promise<AcademicCatalogs> => {
  const [curricula, cohorts, periods] = await Promise.all([
    fetchCatalog("/curricula"),
    fetchCatalog("/cohorts"),
    fetchCatalog("/academic-periods"),
  ]);

  const programs = uniqueOptions(
    curricula.map((item) => {
      const program = asObject(item.program);

      // GET /curricula trả id là ProgramID.
      return buildOption(
        positiveId(item.id) ??
          positiveId(item.programId) ??
          positiveId(program?.id),
        [
          program?.name,
          program?.code,
          item.name,
          item.code,
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
        (_match, term: string, year: string) => `${term} ${year}`,
      );

      return buildOption(positiveId(item.id), [item.name, code, readableCode]);
    }),
  );

  if (!programs.length || !cohortOptions.length || !periodOptions.length) {
    throw new Error(
      "Thiếu danh mục chương trình, khóa hoặc kỳ học từ Backend. " +
        "Đặc biệt, danh sách CTĐT phải trả về programId hoặc program.id; " +
        "id trong danh sách curricula là ProgramID.",
    );
  }

  return {
    programs,
    cohorts: cohortOptions,
    periods: periodOptions,
  };
};
