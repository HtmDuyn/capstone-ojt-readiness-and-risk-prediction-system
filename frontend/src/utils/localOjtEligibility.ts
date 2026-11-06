import type { Attempt, Profile, LocalOjtResult } from '@/types/education/localEligibility.types';

export const LOCAL_OJT_RULE = { minCredits: 70, maxUnpassedCourses: 2 } as const;

export function calculateLocalOjtEligibility(studentId: number, profile: Profile, attempts: Attempt[]): LocalOjtResult {
  const credits = profile.academicProgress?.credits;
  const earned = credits?.earned;
  const earnedCredits = typeof earned === 'number' && Number.isFinite(earned) && earned >= 0 ? earned : null;
  const completed = new Set(attempts.filter(a => a.status === 'PASSED' || a.status === 'RECOGNIZED').map(a => a.courseId));
  // A completed equivalent curriculum requirement also clears its previous failed subject.
  for (const requirement of profile.academicProgress?.requirements ?? []) {
    if (requirement.completed && requirement.kind === 'COURSE') requirement.choices.forEach(id => completed.add(id));
  }
  const failed = new Set(attempts.filter(a => a.status === 'FAILED' && !completed.has(a.courseId)).map(a => a.courseId));
  const academicIssues = earnedCredits === null || credits?.completeConfiguration !== true
    ? ['Chưa đủ dữ liệu tín chỉ hoặc cấu hình chương trình để kết luận.'] : [];
  const reasons: string[] = [];
  if (earnedCredits !== null && earnedCredits < LOCAL_OJT_RULE.minCredits) reasons.push(`Còn thiếu ${Math.round((LOCAL_OJT_RULE.minCredits - earnedCredits) * 100) / 100} tín chỉ so với mức 70.`);
  if (failed.size > LOCAL_OJT_RULE.maxUnpassedCourses) reasons.push(`Còn ${failed.size} môn chưa đạt, vượt giới hạn 2 môn.`);
  return { studentId, earnedCredits, unpassedCourseCount: failed.size, reasons, academicIssues,
    status: academicIssues.length ? 'REVIEW_REQUIRED' : earnedCredits! >= LOCAL_OJT_RULE.minCredits && failed.size <= LOCAL_OJT_RULE.maxUnpassedCourses ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    checkedAt: new Date().toISOString() };
}

