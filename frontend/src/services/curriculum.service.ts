import type { CurriculumDetailResponse, CurriculumImportPayload, CurriculumImportPreviewResponse, SearchCoursesPayload, SearchCoursesResponse, SearchCurriculaPayload, SearchCurriculaResponse, SearchMajorsPayload, SearchMajorsResponse } from '@/types/education/curriculum.types';
import API from './api';
import { apiData, getJson } from './educationApi';

interface ImportResource {
  id: number;
  status: string;
  preview: CurriculumImportPreviewResponse['data'];
  result?: Record<string, unknown>;
}
const approvedImports = new Map<string, { id: number; payload: string }>();
const previewCurriculumImport = async (payload: CurriculumImportPayload): Promise<CurriculumImportPreviewResponse> => {
  approvedImports.delete(payload.idempotencyKey);
  const resource = apiData<ImportResource>((await API.post('/curriculum-imports', payload)).data);
  if (!Number.isSafeInteger(resource.id) || resource.id <= 0 || !['VALIDATED', 'COMMITTED'].includes(resource.status) || resource.preview?.preview !== true || !resource.preview.canCommit) {
    throw new Error('Backend chưa xác nhận khung chương trình hợp lệ để import.');
  }
  if (resource.preview.action !== 'CREATE') throw new Error('Mã chương trình đã tồn tại. Chỉ được import khung mới; không thay thế khung đã nhập.');
  if (approvedImports.size >= 100) approvedImports.delete(approvedImports.keys().next().value!);
  approvedImports.set(payload.idempotencyKey, { id: resource.id, payload: JSON.stringify(payload) });
  return { success: true, data: resource.preview };
};
const commitCurriculumImport = async (payload: CurriculumImportPayload) => {
  const approved = approvedImports.get(payload.idempotencyKey);
  if (!approved || approved.payload !== JSON.stringify(payload)) throw new Error('Cần kiểm tra và xác nhận đúng khung chương trình trước khi import.');
  const resource = apiData<ImportResource>((await API.patch('/curriculum-imports', { id: approved.id, status: 'COMMITTED' })).data);
  if (resource.status !== 'COMMITTED' || !resource.result) throw new Error('Backend chưa xác nhận hoàn tất import chương trình.');
  return { success: true, data: resource.result };
};

export const curriculumService = {
  searchMajors: (payload: SearchMajorsPayload) => getJson<SearchMajorsResponse>('/majors', payload as unknown as Record<string, unknown>),
  searchCourses: (payload: SearchCoursesPayload) => getJson<SearchCoursesResponse>('/courses', payload as unknown as Record<string, unknown>),
  searchCurricula: (payload: SearchCurriculaPayload) => getJson<SearchCurriculaResponse>('/curricula', payload as unknown as Record<string, unknown>),
  getCurriculumDetail: (programId: number) => getJson<CurriculumDetailResponse>(`/curricula/${programId}`),
  previewCurriculumImport,
  commitCurriculumImport,
};
