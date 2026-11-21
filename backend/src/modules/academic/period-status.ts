export function academicPeriodStatusSql(period: string) {
  // New calendar entries start as PLANNED; their dates advance the calendar unless explicitly closed.
  const today = "(statement_timestamp() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date";
  return `CASE
    WHEN ${period}."Status" IN ('CLOSED','ARCHIVED') THEN ${period}."Status"
    WHEN ${today} < ${period}."StartDate" THEN 'PLANNED'
    WHEN ${today} > ${period}."EndDate" THEN 'CLOSED'
    ELSE 'ACTIVE'
  END`;
}
