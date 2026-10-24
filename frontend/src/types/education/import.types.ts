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
  entryAcademicPeriodId?: number;
}

export type StudentAcademicStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'GRADUATED' | 'DROPPED_OUT';

export interface StudentAcademicData {
  programId: number;
  phone?: string;
  className?: string;
  status?: StudentAcademicStatus;
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
  kind?: string;
}

export interface AcademicCatalogs {
  programs: CatalogOption[];
  cohorts: CatalogOption[];
  periods: CatalogOption[];
}

export interface ImportedRelation { id: number; code?: string; name?: string }
export interface ImportedStudent {
  id: number;
  studentCode: string;
  fullName: string;
  email: string;
  phone: string | null;
  className: string | null;
  status: string;
  accountStatus: string;
  programId: number | null;
  cohortId: number | null;
  groupCode: string | null;
  entryAcademicPeriodId: number | null;
  currentAcademicPeriodId: number | null;
  enrollmentYear: number | null;
  currentSemester: number | null;
  program: (ImportedRelation & { majorName?: string; majorCode?: string }) | null;
  cohort: ImportedRelation | null;
  entryAcademicPeriod: ImportedRelation | null;
  currentAcademicPeriod: ImportedRelation | null;
}
export interface ImportedStudentProfile extends ImportedStudent {
  academicProgress?: {
    gpa: number | null;
    gpaScale?: number | null;
    credits: { earned: number; total: number | null; remaining: number | null };
    issues?: string[];
  };
}
export interface StoredCourseResult {
  id: number;
  courseCode: string;
  courseName: string;
  academicPeriodId: number | null;
  periodCode: string | null;
  academicPeriod?: ImportedRelation | null;
  attemptNumber: number;
  status: CourseResultStatus;
  score: number | null;
  gradePoints: number | null;
  grade: string | null;
  sourceReference: string | null;
}
export interface StudentImportBatch {
  id: string;
  sourceAccountBatchId: string | null;
  createdAt: string;
  importedBy: number;
  summary: { total?: number; created?: number; updated?: number };
}
export interface ImportedStudentFilters {
  search: string;
  programId: string;
  cohortId: string;
  status: string;
  importBatchId: string;
}
