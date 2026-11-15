export interface AlertRow {
  studentId?: number;
  ojtSemesterId?: number;
  academicPeriodId?: number | null;
  alertTypes?: string[];
}

const labels: Record<string, string> = {
  CREDIT_SHORTFALL: 'Thiếu tín chỉ',
  MISSING_REQUIRED_COURSES: 'Chưa hoàn thành môn bắt buộc',
  EXCESS_FAILED_COURSES: 'Vượt số môn chưa đạt',
};

export function academicAlertOverview(rows: AlertRow[]) {
  const seen = new Set<string>();
  const students = new Set<number>();
  const counts = new Map<string, number>();
  for (const row of rows) {
    if (!Number.isSafeInteger(row.studentId) || !Number.isSafeInteger(row.ojtSemesterId) || !Array.isArray(row.alertTypes)) continue;
    for (const type of row.alertTypes) {
      const key = `${row.ojtSemesterId}:${row.academicPeriodId ?? ''}:${row.studentId}:${type}`;
      if (seen.has(key)) continue;
      seen.add(key);
      students.add(row.studentId!);
      counts.set(type, (counts.get(type) ?? 0) + 1);
    }
  }
  return {
    total: seen.size,
    studentCount: students.size,
    groups: [...counts].map(([type, count]) => ({ type, label: labels[type] ?? type, count }))
      .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label)),
  };
}
