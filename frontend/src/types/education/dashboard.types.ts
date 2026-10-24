export type JsonObject = Record<string, unknown>;

export type QueryParams = Record<string, string | number>;

export interface AcademicYear {
  id: string;
  code: string;
}

export interface AcademicPeriod {
  id: string;
  academicYearId: string | null;
  code: string;
  name: string;
  ojtSemesterId: string | null;
  assessmentDeadline: string | null;
}

export interface PeriodStatistic {
  label: string;
  eligible: number;
  ineligible: number;
}

export interface CohortProgress {
  label: string;
  percent: number;
}

export interface CourseDemand {
  id: string;
  code: string;
  name: string;
  count: number | null;
}

export interface AcademicAlert {
  id: string;
  title: string;
  description: string;
  date: string | null;
}
