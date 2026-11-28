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
  kind: 'SEMESTER' | 'BLOCK3' | null;
  status: 'PLANNED' | 'ACTIVE' | 'CLOSED' | 'ARCHIVED' | null;
  startDate: string | null;
  ojtSemesterId: string | null;
  assessmentDeadline: string | null;
}

export interface PeriodStatistic {
  label: string;
  eligible: number;
  ineligible: number;
  reviewRequired: number;
}

export interface CohortProgress {
  label: string;
  percent: number;
}

export interface CourseDemand {
  id: string;
  courseId: number | null;
  studentIds: number[] | null;
  code: string;
  name: string;
  count: number | null;
  periodName: string | null;
  ojtSemesterName: string | null;
}

export interface AcademicAlert {
  id: string;
  title: string;
  description: string;
  date: string | null;
}
