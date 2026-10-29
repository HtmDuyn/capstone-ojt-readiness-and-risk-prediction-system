import { apiData, getAllItems, getJson } from './educationApi';
import type { SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import type { EligibilityStatus } from '@/types/education/eligibility.types';
import API from './api';
import { clearEducationReadCache } from './educationReadCache';

type Attempt = { courseId: number; status: string };
type Requirement = { completed: boolean; credits: number | null; choices: number[]; kind?: string };
type Profile = {
  academicProgress?: { credits?: { earned: number; completeConfiguration?: boolean }; requirements?: Requirement[] };
  courseResults?: { items: Attempt[]; page: number; limit: number; total: number };
};
export type LocalOjtResult = {
  studentId: number; status: EligibilityStatus; earnedCredits: number | null;
  unpassedCourseCount: number; reasons: string[]; academicIssues: string[]; checkedAt: string;
  savedAt?: string; isStale?: boolean;
};

// Shared contract with the deployed backend; see docs/ojt-eligibility-save-api.md.
export const LOCAL_OJT_SAVE_ENDPOINT = '/ojt-eligibility-results';
export const loadSavedLocalOjtResults = (signal?: AbortSignal) => getAllItems<SavedOjtEligibility & { studentId: number }>(LOCAL_OJT_SAVE_ENDPOINT, {}, signal);
export async function saveLocalOjtResults(results: LocalOjtResult[], idempotencyKey: string): Promise<number> {
  if (!results.length) throw new Error('Chưa có kết quả xét để lưu.');
  try {
    const response = await API.post<{ success: boolean; message?: string; data?: { savedCount: number } }>(LOCAL_OJT_SAVE_ENDPOINT, {
      idempotencyKey, source: 'FRONTEND', rule: { minCredits: 70, maxUnpassedCourses: 2 },
      results: [...results].sort((a, b) => a.studentId - b.studentId).map(({ studentId, status, earnedCredits, unpassedCourseCount, reasons, academicIssues, checkedAt }) => ({ studentId, status, earnedCredits, unpassedCourseCount, reasons, academicIssues, checkedAt })),
    });
    const body = response.data;
    if (body.success !== true || body.data?.savedCount !== results.length) {
      throw new Error(body.message || 'Backend chưa xác nhận lưu đầy đủ kết quả. Hãy kiểm tra trạng thái lưu trước khi tiếp tục.');
    }
    clearEducationReadCache();
    return body.data.savedCount;
  } catch (error) {
    const status = (error as { response?: { status?: number } } | null)?.response?.status;
    if ([404, 405, 501].includes(status ?? 0)) {
      throw new Error('Chưa lưu được kết quả: backend chưa hỗ trợ API lưu kết quả xét từ FE.');
    }
    throw error;
  }
}

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
  if (earnedCredits !== null && earnedCredits < 70) reasons.push(`Còn thiếu ${Math.round((70 - earnedCredits) * 100) / 100} tín chỉ so với mức 70.`);
  if (failed.size > 2) reasons.push(`Còn ${failed.size} môn chưa đạt, vượt giới hạn 2 môn.`);
  return { studentId, earnedCredits, unpassedCourseCount: failed.size, reasons, academicIssues,
    status: academicIssues.length ? 'REVIEW_REQUIRED' : earnedCredits! >= 70 && failed.size <= 2 ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
    checkedAt: new Date().toISOString() };
}

export async function loadAndCalculateLocalEligibility(studentId: number, signal?: AbortSignal): Promise<LocalOjtResult> {
  const profile = apiData<Profile>(await getJson(`/students/${studentId}`, { include: 'academicProgress,courseResults', resultsLimit: 100 }, signal));
  const first = profile.courseResults;
  if (!first || !Array.isArray(first.items) || !Number.isSafeInteger(first.total) || first.total < 0) throw new Error('Không tải được đầy đủ bảng điểm.');
  const attempts = [...first.items];
  for (let page = first.page + 1; attempts.length < first.total; page++) {
    const next = apiData<Profile>(await getJson(`/students/${studentId}`, { include: 'courseResults', resultsPage: page, resultsLimit: 100 }, signal)).courseResults;
    if (!next?.items.length) throw new Error('Bảng điểm chưa tải đầy đủ; chưa thể xét điều kiện.');
    attempts.push(...next.items);
  }
  return calculateLocalOjtEligibility(studentId, profile, attempts);
}
