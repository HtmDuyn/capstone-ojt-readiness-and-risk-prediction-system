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
    getAllItems<DataObject>("/curricula", { status: 'PUBLISHED' }),
    getAllItems<DataObject>("/cohorts"),
    getAllItems<DataObject>("/academic-periods"),
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
    cohorts.filter(item => item.status !== 'ARCHIVED').map((item) => {
      const option = buildOption(positiveId(item.id), [
        item.cohortCode,
        item.code,
        item.cohortName,
        item.name,
      ]);
      return option ? { ...option, groups: Array.isArray(item.groups) ? item.groups as NonNullable<CatalogOption['groups']> : [] } : null;
    }),
  );

  const periodOptions = uniqueOptions(
    periods.map((item) => {
      const code = text(item.periodCode);

      const readableCode = code.replace(
        /^(FALL|SPRING|SUMMER)(\d{4})$/i,
        (_match, term: string, year: string) => `${term} ${year}`,
      );

      const option = buildOption(positiveId(item.id), [item.name, code, readableCode]);
      return option ? { ...option, kind: text(item.kind) } : null;
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
