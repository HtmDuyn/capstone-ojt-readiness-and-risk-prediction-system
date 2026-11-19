import type { Handoff } from '@/types/education/ojtWorkflow.types';

type Target = { student: { id: number }; reason: string };
type Saved = { isStale?: boolean };

export function handoffsByStudent(handoffs: Handoff[]): Map<number, Handoff[]> {
  const byStudent = new Map<number, Handoff[]>();
  for (const handoff of handoffs) {
    for (const studentId of handoff.studentIds) byStudent.set(studentId, [...(byStudent.get(studentId) ?? []), handoff]);
  }
  return byStudent;
}

export function progressHandoffStatus(studentId: number, handoffs: Handoff[] | null): 'Đã bàn giao' | 'Chưa bàn giao' | 'Chưa xác định' {
  if (handoffs === null) return 'Chưa xác định';
  return handoffs.some(handoff => handoff.studentIds.includes(studentId)) ? 'Đã bàn giao' : 'Chưa bàn giao';
}

export function selectAutoCheckTargets<T extends Target>(targets: T[], saved: Record<number, Saved>, pending: Record<number, unknown>, handedOff: Set<number>): T[] {
  return targets.filter(({ student, reason }) => !reason && !handedOff.has(student.id) && !pending[student.id] && (!saved[student.id] || saved[student.id].isStale));
}

export function selectFullCheckTargets<T extends Target>(targets: T[], handedOff: Set<number>): T[] {
  return targets.filter(({ student, reason }) => !reason && !handedOff.has(student.id));
}

export function selectPendingSaveResults<T extends { studentId: number }>(pending: Record<number, T>): T[] {
  return Object.values(pending);
}

export function matchesHandoffFilter(studentId: number, filter: string, handedOff: Set<number>): boolean {
  return filter === 'ALL' || (filter === 'HANDED_OFF') === handedOff.has(studentId);
}

export function summarizeOjtHandoff(studentIds: number[], saved: Record<number, { status: string; isStale?: boolean }>, handedOff: Set<number>) {
  const eligible = studentIds.filter(id => saved[id]?.status === 'ELIGIBLE' && !saved[id]?.isStale);
  return {
    eligible: eligible.length,
    handedOff: studentIds.filter(id => handedOff.has(id)).length,
    waiting: eligible.filter(id => !handedOff.has(id)).length,
  };
}
