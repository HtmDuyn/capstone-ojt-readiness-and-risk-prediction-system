export interface DashboardPlacementStudent {
  id: number;
  decision?: string | null;
  receivedAt?: string | null;
  hasAssignment?: boolean;
}

export interface QhdnDashboardSummary {
  assignments: { assigned: number; active: number; completed: number };
  results: { total: number; confirmed: number; passed: number };
}

export function placementDashboardStats(items: DashboardPlacementStudent[]) {
  const students = [...new Map(items.map(student => [student.id, student])).values()];
  let accepted = 0, waiting = 0, rejected = 0;
  for (const student of students) {
    if (student.decision === 'ACCEPTED' || student.receivedAt || student.hasAssignment) accepted++;
    else if (student.decision === 'PENDING') waiting++;
    else if (student.decision === 'REJECTED') rejected++;
  }
  return {
    handedOff: students.length,
    assigned: accepted,
    waiting,
    rejected,
    acceptanceRate: students.length ? Math.round(accepted / students.length * 1000) / 10 : 0,
  };
}
