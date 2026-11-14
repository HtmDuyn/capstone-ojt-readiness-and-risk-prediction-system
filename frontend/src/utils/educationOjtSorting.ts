import type { ImportedStudent } from '@/types/education/import.types';
import type { LocalOjtResult } from '@/types/education/localEligibility.types';
import type { OjtDisplayStatus } from './educationOjtReason';
import { educationOjtReason } from './educationOjtReason';

export type OjtSortKey = 'studentCode' | 'fullName' | 'cohort' | 'group' | 'program' | 'credits' | 'courses' | 'status' | 'reason';
export type OjtSortDirection = 'asc' | 'desc';
type Target = { student: ImportedStudent; reason: string };
type SortContext = { results: Record<number, LocalOjtResult>; failures: Record<number, string>; statuses: Record<number, OjtDisplayStatus> };
const collator = new Intl.Collator('vi', { sensitivity: 'base', numeric: true });
const statusLabels: Record<OjtDisplayStatus, string> = {
  ELIGIBLE: 'Đủ điều kiện', NOT_ELIGIBLE: 'Chưa đủ điều kiện', REVIEW_REQUIRED: 'Cần đối soát',
  PENDING: 'Chưa xét', ERROR: 'Gặp lỗi', STALE: 'Cần xét lại', INACTIVE: 'Không hoạt động',
};
export { statusLabels as ojtDisplayStatusLabels };

export function sortOjtTargets<T extends Target>(targets: T[], key: OjtSortKey | null, direction: OjtSortDirection, context: SortContext): T[] {
  if (!key) return targets;
  const value = (target: T): string | number | null => {
    const { student, reason } = target;
    const result = context.results[student.id];
    switch (key) {
      case 'studentCode': return student.studentCode;
      case 'fullName': return student.fullName;
      case 'cohort': return student.cohort?.code ?? '';
      case 'group': return student.groupCode ?? '';
      case 'program': return student.program?.code ?? '';
      case 'credits': return result?.earnedCredits ?? null;
      case 'courses': return result?.unpassedCourseCount ?? null;
      case 'status': return statusLabels[context.statuses[student.id]];
      case 'reason': return educationOjtReason(result, context.failures[student.id], reason);
    }
  };
  const factor = direction === 'asc' ? 1 : -1;
  return [...targets].sort((a, b) => {
    const left = value(a), right = value(b);
    if (left === null || right === null) return left === right ? 0 : (left === null ? 1 : -1);
    return factor * (typeof left === 'number' && typeof right === 'number' ? left - right : collator.compare(String(left), String(right)));
  });
}
