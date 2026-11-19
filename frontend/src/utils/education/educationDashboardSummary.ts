type Row = Record<string, any>;

// Combine API decisions without recalculating OJT eligibility in the client.
export function dashboardSummary(reports: Row[]) {
  const students = new Map<number, Row>();
  for (const report of reports) for (const row of report.rows) {
    if (!students.has(row.studentId)) students.set(row.studentId, row);
  }
  const rows = [...students.values()];
  const counts = (items: Row[]) => ({
    total: items.length,
    eligible: items.filter(r => r.category === 'ELIGIBLE').length,
    notEligible: items.filter(r => r.category === 'NOT_ELIGIBLE').length,
    insufficientData: items.filter(r => r.category === 'INSUFFICIENT_DATA').length,
    awaitingConfirmation: items.filter(r => r.category === 'AWAITING_CONFIRMATION').length,
  });
  const cohorts = new Map<number | null, Row[]>();
  for (const row of rows) {
    const id = row.cohortId ?? null;
    if (!cohorts.has(id)) cohorts.set(id, []);
    cohorts.get(id)!.push(row);
  }
  const names = new Map<number, Row>(reports.flatMap(d => d.cohorts).map(c => [c.CohortID, c]));
  const summary = {
    ...counts(rows),
    currentEvaluation: {
      eligible: rows.filter(r => r.evaluation.status === 'ELIGIBLE').length,
      notEligible: rows.filter(r => r.evaluation.status === 'NOT_ELIGIBLE').length,
      reviewRequired: rows.filter(r => r.evaluation.status === 'REVIEW_REQUIRED').length,
    },
    staleConfirmations: rows.filter(r => r.officialStale).length,
  };
  return {
    summary,
    statistics: {
      groupBy: 'cohort', overall: counts(rows), membershipCountsMayOverlap: false,
      groups: [...cohorts].map(([id, members]) => ({
        id, name: id === null ? null : names.get(id)?.Name ?? names.get(id)?.CohortCode ?? String(id),
        ...counts(members),
      })),
    },
  };
}
