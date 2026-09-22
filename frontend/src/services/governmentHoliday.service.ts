export interface GovernmentHoliday {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  note: string;
  source: "government";
}

/**
 * Sau này hàm này sẽ gọi Spring Boot API.
 *
 * Ví dụ:
 * GET /api/government-holidays?year=2027
 *
 * Backend chịu trách nhiệm đồng bộ lịch nghỉ chính thức
 * từ nguồn Nhà nước.
 */
export const getGovernmentHolidays = async (
  year: string,
): Promise<GovernmentHoliday[]> => {
  console.log(`Load government holidays for ${year}`);

  // Chưa có backend nên hiện tại chưa tự bịa dữ liệu.
  return [];
};