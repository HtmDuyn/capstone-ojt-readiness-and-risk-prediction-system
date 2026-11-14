import { apiData, getAllItems, getJson } from './educationApi';
import type { SavedOjtEligibility } from '@/utils/savedOjtEligibility';
import type { Profile, LocalOjtResult } from '@/types/education/localEligibility.types';
import { calculateLocalOjtEligibility, type LocalOjtRule } from '@/utils/localOjtEligibility';
import API from './api';
import { clearEducationReadCache } from './educationReadCache';
import { localOjtSavePayload } from '@/utils/localOjtSavePayload';

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
    const response = await API.post<{ success: boolean; message?: string; data?: { savedCount: number } }>(
      LOCAL_OJT_SAVE_ENDPOINT, localOjtSavePayload(results, idempotencyKey, rule),
    );
    const body = response.data;
    if (body.success !== true || body.data?.savedCount !== results.length) {
      throw new Error(body.message || 'Backend chưa xác nhận lưu đầy đủ kết quả. Hãy kiểm tra trạng thái lưu trước khi tiếp tục.');
    }
    clearEducationReadCache();
    return body.data.savedCount;
  } catch (error) {
    const response = (error as { response?: { status?: number; data?: { message?: string; errorCode?: string } } } | null)?.response;
    const status = response?.status;
    if ([404, 405, 501].includes(status ?? 0)) {
      throw new Error('Chưa lưu được kết quả: backend chưa hỗ trợ API lưu kết quả xét từ FE.');
    }
    const apiMessage = response?.data?.message;
    if (apiMessage) {
      const translations: Record<string, string> = {
        'Invalid OJT policy snapshot.': 'Quy tắc xét OJT gửi lên không hợp lệ. Vui lòng xét lại trước khi lưu.',
        'OJT policy changed. Recalculate before saving.': 'Quy tắc xét OJT đã thay đổi. Vui lòng xét lại trước khi lưu.',
        'Course history changed after calculation. Recalculate before saving.': 'Bảng điểm đã thay đổi sau lần xét. Vui lòng xét lại trước khi lưu.',
        'All students and their accounts must be active.': 'Có sinh viên hoặc tài khoản không còn hoạt động. Vui lòng tải lại và xét lại.',
      };
      throw new Error(translations[apiMessage] ?? (/[À-ỹ]/.test(apiMessage) ? apiMessage : `Không lưu được kết quả: ${apiMessage}`));
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
