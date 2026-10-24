import API from "./api";

export type Query = Record<string, unknown>;
export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  limit: number;
};
export const cleanQuery = (params: Query = {}) =>
  Object.fromEntries(
    Object.entries(params).filter(
      ([, value]) => value !== undefined && value !== null && value !== "",
    ),
  );
export async function getJson<T>(
  path: string,
  params: Query = {},
  signal?: AbortSignal,
): Promise<T> {
  return (await API.get<T>(path, { params: cleanQuery(params), signal })).data;
}
export function apiData<T>(response: unknown): T {
  const root = response as { success?: boolean; message?: string; data?: T };
  if (root?.success === false)
    throw new Error(root.message || "Yêu cầu không thành công.");
  return (root?.data ?? response) as T;
}
export async function getPage<T>(
  path: string,
  params: Query = {},
  signal?: AbortSignal,
): Promise<Page<T>> {
  const result = apiData<Page<T>>(await getJson(path, params, signal));
  if (!Array.isArray(result?.items))
    throw new Error("Backend trả danh sách không hợp lệ.");
  return result;
}
export async function getAllItems<T>(
  path: string,
  params: Query = {},
  signal?: AbortSignal,
): Promise<T[]> {
  const items: T[] = [];
  for (let page = 1; page <= 1000; page++) {
    const data = await getPage<T>(
      path,
      { ...params, page, limit: 100 },
      signal,
    );
    items.push(...data.items);
    if (items.length >= data.total || data.items.length === 0) return items;
  }
  throw new Error("Danh sách vượt giới hạn tải; hãy thu hẹp bộ lọc.");
}
export const unavailable = (feature: string): never => {
  throw new Error(feature + " chưa được backend hiện tại hỗ trợ.");
};
