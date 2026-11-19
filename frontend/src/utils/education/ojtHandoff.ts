import type { ImportedStudent } from '@/types/education/import.types';
import type { OjtSemester } from '@/types/education/academic.types';
import type { SavedOjtEligibility } from './savedOjtEligibility';

export type HandoffCohort = {
  id: number;
  groups: { groupCode: string; curriculumPeriods: { semester: number; academicPeriodId: number }[] }[];
};

export function handoffTarget(student: ImportedStudent, result: SavedOjtEligibility | undefined, cohorts: HandoffCohort[], semesters: OjtSemester[]) {
  if (!result || result.status !== 'ELIGIBLE') return null;
  const path = cohorts.find(c => c.id === student.cohortId)?.groups?.find(g => g.groupCode === student.groupCode)?.curriculumPeriods;
  const current = path?.find(p => p.semester === 5);
  const next = path?.find(p => p.semester === 6);
  const mappingValid = Boolean(current && current.academicPeriodId === student.currentAcademicPeriodId && next);
  const targets = mappingValid ? semesters.filter(s => s.academicPeriodId === next!.academicPeriodId) : [];
  const target = targets.length === 1 ? targets[0] : undefined;
  return { result, target, curriculumSemester: next?.semester ?? null, issue: result.isStale ? 'Kết quả xét đã cũ; cần xét và lưu lại'
    : student.status !== 'ACTIVE' || student.accountStatus !== 'ACTIVE' ? 'Sinh viên hoặc tài khoản không hoạt động'
    : student.currentSemester !== 5 ? 'Sinh viên chưa ở kỳ chương trình 5'
    : !mappingValid ? 'Chưa cấu hình đúng lộ trình kỳ 5 → kỳ 6 của khóa/nhóm'
    : !target ? 'Chưa xác định duy nhất kỳ OJT tương ứng kỳ 6' : '' };
}
