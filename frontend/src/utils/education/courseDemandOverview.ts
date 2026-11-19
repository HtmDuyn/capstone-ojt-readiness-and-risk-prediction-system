import type { CourseDemand } from '@/types/education/dashboard.types';

export function courseDemandOverview(rows: CourseDemand[]) {
  const courseIdsComplete = rows.every(row => row.courseId !== null);
  const studentIdsComplete = rows.every(row => row.courseId !== null && row.studentIds !== null);
  const courses = new Set(rows.map(row => row.courseId).filter((id): id is number => id !== null));
  const pairs = new Set<string>();
  if (studentIdsComplete) for (const row of rows) for (const studentId of row.studentIds!) pairs.add(`${studentId}:${row.courseId}`);
  return {
    courseCount: courseIdsComplete ? courses.size : null,
    demandCount: studentIdsComplete ? pairs.size : null,
    top: [...rows].sort((a, b) => (b.count ?? -1) - (a.count ?? -1) || a.code.localeCompare(b.code)).slice(0, 5),
  };
}
