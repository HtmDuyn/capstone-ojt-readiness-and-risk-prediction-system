import { API_ORIGIN } from "@/config/api";
import type { ImportCommitResponse, ImportPreviewResponse, StudentImportPayload } from '@/types/education/import.types';
import type { ImportedStudent, ImportedStudentFilters, ImportedStudentProfile, StoredCourseResult, StudentImportBatch } from '@/types/education/import.types';
import { apiData, getAllItems, getJson, getPage } from './educationApi';
import { clearEducationReadCache } from './educationReadCache';

type ApiErrorResponse = {
  success?: boolean;
  errorCode?: string;
  message?: string;
};

const sendImportRequest = async <T>(
  endpoint: string,
  payload: unknown,
  fallbackError: string,
  method: 'POST' | 'PATCH' = 'POST',
): Promise<T> => {
  const token = localStorage.getItem("ojt_auth_token");

  if (!token) {
    throw new Error("Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.");
  }

  const response = await fetch(`${API_ORIGIN}${endpoint}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  let result: unknown;

  try {
    result = await response.json();
  } catch {
    throw new Error(
      `Backend trả về dữ liệu không hợp lệ (HTTP ${response.status}).`,
    );
  }

  const body =
    result !== null && typeof result === "object" && !Array.isArray(result)
      ? (result as ApiErrorResponse)
      : null;

  if (response.status === 401) {
    throw new Error("Phiên đăng nhập đã hết hạn hoặc không hợp lệ.");
  }

  if (response.status === 403) {
    throw new Error("Tài khoản không có quyền thực hiện chức năng này.");
  }

  if (response.status === 404) {
    throw new Error(
      `API ${endpoint} chưa có trên Backend đang deploy (HTTP 404). ` +
        "Kiểm tra nhánh đã merge và phiên bản Render.",
    );
  }

  if (!response.ok || body?.success === false) {
    throw new Error(
      body?.message || `${fallbackError} (HTTP ${response.status}).`,
    );
  }

  if (!body) {
    throw new Error("Backend trả về cấu trúc kết quả không hợp lệ.");
  }

  clearEducationReadCache();
  return result as T;
};

interface StudentImportResource {
  id: number;
  status: string;
  preview: Omit<ImportPreviewResponse, 'success'>;
  result?: Omit<ImportCommitResponse, 'success'>;
}

export const importService = {
  listImportedStudents: (filters: ImportedStudentFilters, page: number, signal?: AbortSignal) =>
    getPage<ImportedStudent>('/students', { ...filters, importedOnly: 'true', page, limit: 20 }, signal),
  listStudentImportBatches: (signal?: AbortSignal) =>
    getAllItems<StudentImportBatch>('/academic-imports', { kind: 'STUDENT', status: 'COMPLETED' }, signal),
  getImportedStudent: async (id: number, signal?: AbortSignal) =>
    apiData<ImportedStudentProfile>(await getJson(`/students/${id}`, { resultsLimit: 1, ojtLimit: 1 }, signal)),
  getStoredCourseResults: async (id: number, page: number, signal?: AbortSignal) =>
    apiData<{ courseResults: import('@/types/education/api.types').Page<StoredCourseResult> }>(
      await getJson(`/students/${id}`, { include: 'courseResults', resultsPage: page, resultsLimit: 20 }, signal),
    ).courseResults,
  previewStudentImport: async (payload: StudentImportPayload): Promise<ImportPreviewResponse> => {
    const response = await sendImportRequest<unknown>(
      '/api/student-imports',
      { idempotencyKey: payload.idempotencyKey, rows: payload.rows },
      'Không thể kiểm tra dữ liệu sinh viên',
    );
    const resource = apiData<StudentImportResource>(response);
    if (resource.status !== 'VALIDATED' || resource.preview?.preview !== true)
      throw new Error('Backend chưa xác nhận dữ liệu import hợp lệ.');
    return { ...resource.preview, success: true, importId: resource.id };
  },

  commitStudentImport: async (importId: number): Promise<ImportCommitResponse> => {
    const response = await sendImportRequest<unknown>(
      '/api/student-imports', { id: importId, status: 'COMMITTED' },
      'Không thể nhập dữ liệu sinh viên', 'PATCH',
    );
    const resource = apiData<StudentImportResource>(response);
    if (resource.status !== 'COMMITTED' || !resource.result)
      throw new Error('Backend chưa xác nhận hoàn tất import.');
    return { ...resource.result, success: true };
  },
};
