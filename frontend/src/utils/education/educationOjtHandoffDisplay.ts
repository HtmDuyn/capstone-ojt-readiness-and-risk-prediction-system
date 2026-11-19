import type { Handoff } from '@/types/education/ojtWorkflow.types';

export type HandoffDisplay = { semesterName: string; roundNumber: number };

// Number rounds from the complete history, independently of table order or filters.
export function handoffDisplayById(history: Handoff[]): Map<number, HandoffDisplay> {
  const roundsBySemester = new Map<number, number>();
  const display = new Map<number, HandoffDisplay>();
  for (const handoff of [...history].sort((a, b) => a.id - b.id)) {
    const roundNumber = (roundsBySemester.get(handoff.ojtSemesterId) ?? 0) + 1;
    roundsBySemester.set(handoff.ojtSemesterId, roundNumber);
    display.set(handoff.id, { semesterName: handoff.semester?.name?.trim() || '—', roundNumber });
  }
  return display;
}

export function matchingHandoffStudentIds(handoff: Handoff, students: Map<number, { studentCode: string; fullName: string }>, query: string): Set<number> {
  const normalized = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi').trim();
  if (!normalized) return new Set();
  return new Set(handoff.studentIds.filter(id => {
    const student = students.get(id);
    return student && `${student.studentCode} ${student.fullName}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi').includes(normalized);
  }));
}

export function filterHandoffHistory(history: Handoff[], students: Map<number, { studentCode: string; fullName: string }>, query: string, semesterId: string, round: string): Handoff[] {
  const display = handoffDisplayById(history);
  const normalized = query.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi').trim();
  return history.filter(handoff =>
    (!semesterId || String(handoff.ojtSemesterId) === semesterId) &&
    (!round || String(display.get(handoff.id)?.roundNumber) === round) &&
    (!normalized || handoff.reason.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/gi, 'd').toLocaleLowerCase('vi').includes(normalized) || matchingHandoffStudentIds(handoff, students, query).size > 0));
}
