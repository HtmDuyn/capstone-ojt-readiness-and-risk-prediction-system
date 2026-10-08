const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ||
  'https://capstone-ojt-readiness-and-risk.onrender.com';

export type AcademicYearStatus =
  | 'PLANNED'
  | 'ACTIVE'
  | 'COMPLETED';

export interface CreateAcademicYearPayload {
  yearCode: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
}

export interface AcademicYear {
  id: number;
  yearCode: string;
  startDate: string;
  endDate: string;
  status: AcademicYearStatus;
}
export interface SearchAcademicYearsResponse {
  success: boolean;
  items: AcademicYear[];
  page: number;
  limit: number;
  total: number;
}

interface CreateAcademicYearResponse {
  success: boolean;
  data: AcademicYear;
}

interface ApiErrorResponse {
  success?: boolean;
  errorCode?: string;
  message?: string;
}

const getAuthToken = () => {
  return localStorage.getItem('ojt_auth_token');
};

const createAcademicYear = async (
  payload: CreateAcademicYearPayload,
): Promise<AcademicYear> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/academic-years`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const result = (await response.json()) as
    | CreateAcademicYearResponse
    | ApiErrorResponse;

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    if (response.status === 401) {
      throw new Error(
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
      );
    }

    if (
      response.status === 409 ||
      error.errorCode === 'ACADEMIC_DUPLICATE'
    ) {
      throw new Error(
        'Năm học này đã tồn tại trong hệ thống.',
      );
    }

    throw new Error(
      error.message || 'Không thể tạo năm học.',
    );
  }

  const successResult =
    result as CreateAcademicYearResponse;

  return successResult.data;
};
const searchAcademicYears = async (): Promise<AcademicYear[]> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      'Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.',
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/json/academic-years/search`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        page: 1,
        limit: 100,
        search: '2',
        status: 'PLANNED',
      }),
    },
  );

  const result =
    (await response.json()) as
      | SearchAcademicYearsResponse
      | ApiErrorResponse;

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    if (response.status === 401) {
      throw new Error(
        'Phiên đăng nhập đã hết hạn hoặc không hợp lệ.',
      );
    }

    throw new Error(
      error.message || 'Không thể tải danh sách năm học.',
    );
  }

  const successResult =
    result as SearchAcademicYearsResponse;

  return successResult.items;
};
export const academicService = {
  createAcademicYear,
  searchAcademicYears,
};

