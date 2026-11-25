import type { AcademicProgressData } from '../students/academic-progress';

// Created inside one authorized, read-only assessment transaction. Never kept
// between requests: grade/curriculum changes must affect the very next read.
export interface AssessmentReadContext {
  source?: AcademicProgressData;
  prerequisiteGroups?: Record<string, any>[];
  studyPeriod?: { curriculumSemester: number | null; referenceDate: Date };
}
