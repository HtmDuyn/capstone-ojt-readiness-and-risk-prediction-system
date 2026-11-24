export type AcademicYearStatus = "PLANNED" | "ACTIVE" | "COMPLETED" | "CLOSED";

export interface CreateAcademicYearPayload {
  blocks?: SemesterDates[];
  block10?: SemesterDates[];
  yearCode: string;
}

export interface AcademicYear {
  id: number;
  yearCode: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
}

export type AcademicPeriodKind = "SEMESTER" | "BLOCK3";

export type AcademicPeriodStatus =
  "PLANNED" | "ACTIVE" | "COMPLETED" | "CLOSED" | "ARCHIVED";

export interface CreateAcademicPeriodPayload {
  academicYearId: number;
  periodCode: string;
  name: string;
  kind: AcademicPeriodKind;
  startDate: string;
  endDate: string;
  status?: AcademicPeriodStatus;
}

type CalendarRange = { startDate: string; endDate: string };
export type SemesterBlockCalendar = {
  mainSemester: CalendarRange;
  block: CalendarRange;
};

export interface AcademicPeriod {
  id: number;
  academicYearId: number;
  periodCode: string;
  name: string;
  kind: AcademicPeriodKind;
  parentPeriodId: number | null;
  startDate: string;
  endDate: string;
  block10StartDate?: string | null;
  block10EndDate?: string | null;
  blockCalendar?: SemesterBlockCalendar | null;
  status: AcademicPeriodStatus;
}

export interface SearchAcademicPeriodsPayload {
  page: number;
  limit: number;
  academicYearId?: number;
  search?: string;
}

export interface OjtSemester {
  id: number;
  academicYearId: number;
  semesterCode: string;
  name: string;
  academicPeriodId: number | null;
  startDate: string;
  endDate: string;
  regStartDate: string | null;
  regEndDate: string | null;
  status: AcademicPeriodStatus;
}

export interface SearchOjtSemestersPayload {
  page: number;
  limit: number;
  search?: string;
  status?: AcademicPeriodStatus;
  academicYearId?: number;
}

export type CalendarTerm = 'SPRING' | 'SUMMER' | 'FALL';
export interface SemesterDates {
  term: CalendarTerm;
  startDate: string;
  endDate: string;
}
export interface AcademicCalendar {
  year: AcademicYear & { periods?: Pick<AcademicPeriod, 'id' | 'kind' | 'parentPeriodId' | 'startDate' | 'endDate'>[] };
  semesters: AcademicPeriod[];
  revision: string;
}
