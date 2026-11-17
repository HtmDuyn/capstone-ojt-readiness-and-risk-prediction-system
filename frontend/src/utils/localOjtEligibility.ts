import type { Attempt, Profile, LocalOjtResult } from '@/types/education/localEligibility.types';

export type LocalOjtRule = { version: number; minCredits: number; maxUnpassedCourses: number };

export function calculateLocalOjtEligibility(studentId: number, profile: Profile, attempts: Attempt[], rule: LocalOjtRule): LocalOjtResult {
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
  if (earnedCredits !== null && earnedCredits < rule.minCredits) reasons.push(`Còn thiếu ${Math.round((rule.minCredits - earnedCredits) * 100) / 100} tín chỉ so với mức ${rule.minCredits}.`);
  if (failed.size > rule.maxUnpassedCourses) reasons.push(`Còn ${failed.size} môn chưa đạt, vượt giới hạn ${rule.maxUnpassedCourses} môn.`);
  return { studentId, earnedCredits, unpassedCourseCount: failed.size, reasons, academicIssues,
    status: academicIssues.length ? 'REVIEW_REQUIRED' : earnedCredits! >= rule.minCredits && failed.size <= rule.maxUnpassedCourses ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    policyVersion: rule.version, checkedAt: new Date().toISOString() };
}

