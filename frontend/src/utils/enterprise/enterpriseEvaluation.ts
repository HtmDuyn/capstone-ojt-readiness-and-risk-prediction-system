export const evaluationScoreFields = [
  { key: 'completionScore', label: 'Kỹ năng chuyên ngành' },
  { key: 'skillScore', label: 'Kỹ năng mềm' },
  { key: 'attitudeScore', label: 'Thái độ' },
] as const;
export type EvaluationScoreKey = typeof evaluationScoreFields[number]['key'];
export type EvaluationScores = Record<EvaluationScoreKey, string>;

export function parseEvaluationScore(value: string): number | null {
  if (!value.trim()) return null;
  const score = Number(value);
  return Number.isFinite(score) && score >= 0 && score <= 10
    && Math.abs(score * 100 - Math.round(score * 100)) < 1e-7 ? score : null;
}

export function evaluationAverage(scores: EvaluationScores): number | null {
  const values = evaluationScoreFields.map(field => parseEvaluationScore(scores[field.key]));
  return values.some(value => value === null) ? null
    : Math.round(values.reduce<number>((sum, value) => sum + value!, 0) / 3 * 100) / 100;
}

export function taskScoreSuggestion(completed: number, total: number): number | null {
  if (total <= 0) return null;
  return Math.round(Math.min(1, Math.max(0, completed / total)) * 1000) / 100;
}

export function applyEvaluationScore<T extends EvaluationScores>(row: T, column: EvaluationScoreKey | 'all', value: string): T {
  const next = { ...row };
  for (const field of evaluationScoreFields) if (column === 'all' || field.key === column) next[field.key] = value;
  return next;
}
