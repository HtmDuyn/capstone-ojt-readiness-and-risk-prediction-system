export type CourseResultStatus =
  "PASSED" | "FAILED" | "IN_PROGRESS" | "WITHDRAWN" | "RECOGNIZED";

export interface StudentCourseResult {
  courseCode: string;
  academicPeriodId: number;
  status: CourseResultStatus;
  score?: number;
  gradePoints?: number;
  grade?: string;
  attemptNumber?: number;
  sourceReference?: string;
}

export interface StudentPlacement {
  cohortId: number;
  groupCode: "A" | "B" | "C" | "D";
  currentAcademicPeriodId: number;
}

export interface StudentAcademicData {
  programId: number;
  phone?: string;
  className?: string;
  placement: StudentPlacement;
  courseResults: StudentCourseResult[];
}

export interface StudentImportRow {
  code: string;
  email: string;
  fullName: string;
  academic: StudentAcademicData;
}

export interface StudentImportPayload {
  kind: "STUDENT";
  idempotencyKey: string;
  rows: StudentImportRow[];
}

export interface ImportPreviewRow {
  rowNumber: number;
  code?: string;
  action?: string;
  message?: string;
  errors?: string[];
}

export interface ImportPreviewResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  preview: boolean;
  rows: ImportPreviewRow[];
}

export interface ImportCommitResponse {
  success: boolean;
  created: number;
  updated: number;
  total: number;
  batchId?: string;
  academicImportId?: string;
  replayed?: boolean;
}

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
