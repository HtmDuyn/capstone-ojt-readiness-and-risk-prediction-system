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
