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
export type AcademicPeriodKind = "SEMESTER";

export type AcademicPeriodStatus =
  | "PLANNED"
  | "ACTIVE"
  | "COMPLETED";

export interface CreateAcademicPeriodPayload {
  academicYearId: number;
  periodCode: string;
  name: string;
  kind: AcademicPeriodKind;
  startDate: string;
  endDate: string;
  status: AcademicPeriodStatus;
}

export interface AcademicPeriod {
  id: number;
  academicYearId: number;
  periodCode: string;
  name: string;
  kind: AcademicPeriodKind;
  parentPeriodId: number | null;
  startDate: string;
  endDate: string;
  status: AcademicPeriodStatus;
}
export interface UpdateAcademicPeriodPayload {
  academicYearId: number;
  periodCode: string;
  name: string;
  kind: AcademicPeriodKind;
  parentPeriodId: number | null;
  startDate: string;
  endDate: string;
  status: AcademicPeriodStatus;
  academicPeriodId: number;
}

interface UpdateAcademicPeriodResponse {
  success: boolean;
  data: AcademicPeriod;
}
export interface SearchAcademicPeriodsPayload {
  page: number;
  limit: number;
  search: string;
  status: AcademicPeriodStatus;
  academicYearId: number;
  kind: AcademicPeriodKind;
}

interface SearchAcademicPeriodsResponse {
  success: boolean;
  items: AcademicPeriod[];
  page: number;
  limit: number;
  total: number;
}

interface CreateAcademicPeriodResponse {
  success: boolean;
  data: AcademicPeriod;
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
const createAcademicPeriod = async (
  payload: CreateAcademicPeriodPayload,
): Promise<AcademicPeriod> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/academic-periods`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const result = (await response.json()) as
    | CreateAcademicPeriodResponse
    | ApiErrorResponse;

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    if (response.status === 401) {
      throw new Error(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
      );
    }

    if (response.status === 409) {
      throw new Error(
        "Kỳ học này đã tồn tại trong hệ thống.",
      );
    }

    throw new Error(
      error.message || "Không thể tạo kỳ học.",
    );
  }

  const successResult =
    result as CreateAcademicPeriodResponse;

  return successResult.data;
};
const searchAcademicPeriods = async (
  payload: SearchAcademicPeriodsPayload,
): Promise<AcademicPeriod[]> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/json/academic-periods/search`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const result = (await response.json()) as
    | SearchAcademicPeriodsResponse
    | ApiErrorResponse;

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    if (response.status === 401) {
      throw new Error(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
      );
    }

    throw new Error(
      error.message || "Không thể tải danh sách kỳ học.",
    );
  }

  const successResult =
    result as SearchAcademicPeriodsResponse;

  return successResult.items;
};
const updateAcademicPeriod = async (
  payload: UpdateAcademicPeriodPayload,
): Promise<AcademicPeriod> => {
  const token = getAuthToken();

  if (!token) {
    throw new Error(
      "Không tìm thấy token đăng nhập. Vui lòng đăng nhập lại.",
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/json/academic-periods`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  const result = (await response.json()) as
    | UpdateAcademicPeriodResponse
    | ApiErrorResponse;

  if (!response.ok) {
    const error = result as ApiErrorResponse;

    if (response.status === 401) {
      throw new Error(
        "Phiên đăng nhập đã hết hạn hoặc không hợp lệ.",
      );
    }

    throw new Error(
      error.message || "Không thể cập nhật kỳ học.",
    );
  }

  const successResult =
    result as UpdateAcademicPeriodResponse;

  return successResult.data;
};
export const academicService = {
  createAcademicYear,
  searchAcademicYears,
  createAcademicPeriod,
  searchAcademicPeriods,
  updateAcademicPeriod,
};

