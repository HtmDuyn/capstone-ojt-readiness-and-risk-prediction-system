import { apiData, getAllItems, getJson } from './educationApi';
import type { SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import type { Profile, LocalOjtResult } from '@/types/education/localEligibility.types';
import { calculateLocalOjtEligibility, type LocalOjtRule } from '@/utils/localOjtEligibility';
import API from './api';
import { clearEducationReadCache } from './educationReadCache';

// Shared contract with the deployed backend; see docs/ojt-eligibility-save-api.md.
export const LOCAL_OJT_SAVE_ENDPOINT = '/ojt-eligibility-results';
export const loadSavedLocalOjtResults = (signal?: AbortSignal) => getAllItems<SavedOjtEligibility & { studentId: number }>(LOCAL_OJT_SAVE_ENDPOINT, {}, signal);
export type CurrentOjtRule = LocalOjtRule & { legacyApi?: true };
export const loadCurrentOjtRule = async (signal?: AbortSignal): Promise<CurrentOjtRule> => {
  // The main backend has a fixed 70/2 rule and no policy endpoint yet.
  if (import.meta.env.VITE_OJT_POLICY_API !== 'true') {
    return { version: 0, minCredits: 70, maxUnpassedCourses: 2, legacyApi: true };
  }
  try {
    return apiData<LocalOjtRule>(await getJson('/ojt-condition-policy', {}, signal));
  } catch (error) {
    const response = (error as { response?: { status?: number; data?: { errorCode?: string } } } | null)?.response;
    if (response?.status === 404 && response.data?.errorCode === 'ROUTE_NOT_FOUND') {
      return { version: 0, minCredits: 70, maxUnpassedCourses: 2, legacyApi: true };
    }
    throw error;
  }
};
export async function saveLocalOjtResults(results: LocalOjtResult[], idempotencyKey: string, rule: CurrentOjtRule): Promise<number> {
  if (!results.length) throw new Error('Chưa có kết quả xét để lưu.');
  try {
    const response = await API.post<{ success: boolean; message?: string; data?: { savedCount: number } }>(LOCAL_OJT_SAVE_ENDPOINT, {
      idempotencyKey, source: 'FRONTEND', rule: rule.legacyApi
        ? { minCredits: rule.minCredits, maxUnpassedCourses: rule.maxUnpassedCourses }
        : { version: rule.version, minCredits: rule.minCredits, maxUnpassedCourses: rule.maxUnpassedCourses },
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

export async function loadAndCalculateLocalEligibility(studentId: number, rule: LocalOjtRule, signal?: AbortSignal): Promise<LocalOjtResult> {
  const profile = apiData<Profile>(await getJson(`/students/${studentId}`, { include: 'academicProgress,courseResults', resultsLimit: 100 }, signal));
  const first = profile.courseResults;
  if (!first || !Array.isArray(first.items) || !Number.isSafeInteger(first.total) || first.total < 0) throw new Error('Không tải được đầy đủ bảng điểm.');
  const attempts = [...first.items];
  for (let page = first.page + 1; attempts.length < first.total; page++) {
    const next = apiData<Profile>(await getJson(`/students/${studentId}`, { include: 'courseResults', resultsPage: page, resultsLimit: 100 }, signal)).courseResults;
    if (!next?.items.length) throw new Error('Bảng điểm chưa tải đầy đủ; chưa thể xét điều kiện.');
    attempts.push(...next.items);
  }
  return calculateLocalOjtEligibility(studentId, profile, attempts, rule);
}
