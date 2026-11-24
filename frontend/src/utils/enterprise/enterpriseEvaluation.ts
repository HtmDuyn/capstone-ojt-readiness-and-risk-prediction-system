export interface EvaluationCriterion { key: string; label: string; weight: number }
export interface EvaluationScores {
  criteria: EvaluationCriterion[];
  scoreDetails: Record<string, string>;
}

export function parseEvaluationScore(value: string): number | null {
  if (!value.trim()) return null;
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 10
    && Math.abs(score * 100 - Math.round(score * 100)) < 1e-7 ? score : null;
}

export function evaluationAverage(scores: EvaluationScores): number | null {
  if (!scores.criteria.length) return null;
  const values = scores.criteria.map(field => parseEvaluationScore(scores.scoreDetails[field.key] ?? ''));
  return values.some(value => value === null) ? null : Math.round(scores.criteria.reduce((sum, field, index) =>
    sum + Math.round(values[index]! * 100) * Math.round(field.weight * 100), 0) / 10000) / 100;
}

export function taskScoreSuggestion(completed: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round(Math.min(1, Math.max(0, completed / total)) * 1000) / 100;
}

export function applyEvaluationScore<T extends EvaluationScores>(row: T, column: string | null, value: string): T {
  const next = { ...row, scoreDetails: { ...row.scoreDetails } };
  for (const field of row.criteria) if (column === null || field.key === column) next.scoreDetails[field.key] = value;
  return next;
}
