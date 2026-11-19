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
export type OjtLoadIssue = { endpoint: string; status?: number; errorCode?: string; message: string };

export function ojtLoadIssue(key: OjtSourceKey, error: unknown): OjtLoadIssue {
  const response = (error as { response?: { status?: number; data?: { errorCode?: string; message?: string } } })?.response;
  return {
    endpoint: ojtSourceEndpoints[key],
    status: response?.status,
    errorCode: response?.data?.errorCode,
    message: response?.data?.message || (error instanceof Error ? error.message : 'Không rõ nguyên nhân.'),
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
