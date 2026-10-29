import type { ImportedStudent } from '@/types/education/import.types';
import type { OjtSemester } from '@/types/education/academic.types';
import type { SavedOjtEligibility } from './savedOjtEligibility';

export type HandoffCohort = {
  id: number;
  groups: { groupCode: string; curriculumPeriods: { semester: number; academicPeriodId: number }[] }[];
};

export function handoffTarget(student: ImportedStudent, result: SavedOjtEligibility | undefined, cohorts: HandoffCohort[], semesters: OjtSemester[]) {
  if (student.currentSemester !== 5 || student.status !== 'ACTIVE' || student.accountStatus !== 'ACTIVE'
    || !result || result.status !== 'ELIGIBLE' || result.isStale) return null;
  const path = cohorts.find(c => c.id === student.cohortId)?.groups?.find(g => g.groupCode === student.groupCode)?.curriculumPeriods;
  const current = path?.find(p => p.semester === 5);
  const next = path?.find(p => p.semester === 6);
  const mappingValid = Boolean(current && current.academicPeriodId === student.currentAcademicPeriodId && next);
  const targets = mappingValid ? semesters.filter(s => s.academicPeriodId === next!.academicPeriodId) : [];
  const target = targets.length === 1 ? targets[0] : undefined;
  return { result, target, issue: !mappingValid ? 'Chưa cấu hình đúng lộ trình kỳ 5 → kỳ 6 của khóa/nhóm'
    : !target ? 'Chưa xác định duy nhất kỳ OJT tương ứng kỳ 6' : '' };
}
