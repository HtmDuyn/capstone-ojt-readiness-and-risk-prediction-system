import { friendlyErrorMessage } from '@/utils/shared/friendlyError';

export const ojtSourceEndpoints = {
  students: '/students',
  results: '/ojt-eligibility-results',
  policy: '/ojt-condition-policy',
  handoffs: '/eligible-student-handoffs',
  thresholds: '/ojt-credit-thresholds',
} as const;

export const ojtSourceLabels = {
  students: 'danh sách sinh viên',
  results: 'kết quả xét OJT',
  policy: 'điều kiện xét OJT',
  handoffs: 'lịch sử bàn giao',
  thresholds: 'mức tín chỉ',
} as const;

export type OjtSourceKey = keyof typeof ojtSourceEndpoints;
export type OjtLoadIssue = { message: string };

export function ojtLoadIssue(key: OjtSourceKey, error: unknown): OjtLoadIssue {
  void key;
  return {
    message: friendlyErrorMessage(error, 'Tạm thời chưa thể tải dữ liệu này. Vui lòng thử lại.'),
  };
}


export function partitionOjtLoad(keys: readonly OjtSourceKey[], settled: readonly PromiseSettledResult<unknown>[]) {
  const values: Partial<Record<OjtSourceKey, unknown>> = {};
  const issues: Partial<Record<OjtSourceKey, OjtLoadIssue>> = {};
  keys.forEach((key, index) => {
    const result = settled[index];
    if (result.status === 'fulfilled') values[key] = result.value;
    else issues[key] = ojtLoadIssue(key, result.reason);
  });
  return { values, issues };
}
