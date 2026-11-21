import { academicPeriodStatusSql } from '../academic/period-status';

export function enterpriseSemesterStatusSql(period: string, semester: string) {
  // Older OJT records may have no calendar link. Use their own dates in that case.
  return `CASE WHEN ${period}."AcademicPeriodID" IS NULL THEN (${academicPeriodStatusSql(semester)})
    ELSE (${academicPeriodStatusSql(period)}) END`;
}

export function visibleEnterpriseSemester(semesterId: string) {
  return `EXISTS (SELECT 1 FROM "OJTSemesters" term
    LEFT JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=term."AcademicPeriodID"
    WHERE term."OJTSemesterID"=${semesterId}
      AND (${enterpriseSemesterStatusSql('period','term')}) IN ('ACTIVE','CLOSED'))`;
}
