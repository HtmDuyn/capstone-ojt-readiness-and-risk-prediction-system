import type { Attempt, Profile, LocalOjtResult } from '@/types/education/localEligibility.types';

export type LocalOjtRule = { id: number; version: number; minCredits: number; issuingDocument: string };

const excludedCreditName = /(?:\bGDTC\b|\bGDQP\b|\bQPAN\b|\bPE\b|\bphysical\s+education\b|\bmilitary\b|quoc\s+phong|giao\s+duc\s+the\s+chat|the\s+duc|nhac\s+cu|musical\s+instrument)/i;
const normalizeCourseText = (value: string) => value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd');

export function calculateLocalOjtEligibility(studentId: number, profile: Profile, attempts: Attempt[], rule: LocalOjtRule): LocalOjtResult {
  const credits = profile.academicProgress?.credits;
  const earned = credits?.ojtEarned ?? credits?.earned;
  const requirements = profile.academicProgress?.requirements ?? [];
  const curriculumEarned = requirements.filter(requirement => requirement.completed && !excludedCreditName.test(normalizeCourseText(`${requirement.name ?? ''} ${requirement.courseCode ?? ''}`)) && !/(?:^|[\s._-])PE\s*\d+\b/i.test(`${requirement.name ?? ''} ${requirement.courseCode ?? ''}`))
    .reduce((sum, requirement) => sum + (typeof requirement.credits === 'number' && Number.isFinite(requirement.credits) ? requirement.credits : 0), 0);
  const earnedCredits = requirements.length && typeof earned === 'number' && Number.isFinite(earned) && earned >= 0 ? Math.round(curriculumEarned * 100) / 100 : null;
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
  return { studentId, earnedCredits, unpassedCourseCount: failed.size, reasons, academicIssues,
    status: academicIssues.length ? 'REVIEW_REQUIRED' : earnedCredits! >= rule.minCredits ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    policyVersion: rule.version, checkedAt: new Date().toISOString() };
}

