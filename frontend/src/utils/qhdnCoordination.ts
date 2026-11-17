export function canSelectForCoordination(student: {
  canCoordinate?: boolean; decision?: string; receivedAt?: string; hasAssignment?: boolean;
}) {
  return student.canCoordinate === true && student.decision !== 'ACCEPTED' && !student.receivedAt && !student.hasAssignment;
}

export async function coordinateBatch<T extends { id: number }>(
  students: T[], submit: (student: T) => Promise<unknown>, onProgress: (completed: number) => void,
) {
  const succeeded: T[] = [];
  const failed: { student: T; error: unknown }[] = [];
  const unique = [...new Map(students.map(student => [student.id, student])).values()];
  for (const student of unique) {
    try { await submit(student); succeeded.push(student); }
    catch (error) { failed.push({ student, error }); }
    onProgress(succeeded.length + failed.length);
  }
  return { succeeded, failed };
}
