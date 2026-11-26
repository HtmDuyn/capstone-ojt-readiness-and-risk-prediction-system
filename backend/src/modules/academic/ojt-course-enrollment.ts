import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';
import { audit } from './academic.repository';

/** Record curriculum OJT202 only after a successful OJT registration. */
export async function recordOjt202InProgress(
  client: PoolClient,
  studentId: number,
  ojtSemesterId: number,
  actorId: number,
) {
  const target = (await client.query(`
    SELECT period."AcademicPeriodID",period."AcademicYearID",period."Kind",
      COALESCE(period."ParentPeriodID",period."AcademicPeriodID") AS "RootPeriodID"
    FROM "OJTSemesters" term
    JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=term."AcademicPeriodID"
    WHERE term."OJTSemesterID"=$1 FOR SHARE OF term,period`, [ojtSemesterId])).rows[0];
  if (!target || target.Kind !== 'SEMESTER')
    throw invalid('Kỳ OJT phải gắn với một học kỳ thực tế.', 409, 'OJT_PERIOD_REQUIRED');

  const relativeSemester = (await client.query(
    'SELECT "StudentCurriculumSemester"($1,$2) AS relative',[studentId,target.AcademicPeriodID],
  )).rows[0]?.relative;
  if (!Number.isInteger(relativeSemester) || relativeSemester < 6)
    throw invalid('OJT có thể bắt đầu từ học kỳ tương đối thứ 6 trở đi.',409,'OJT_MINIMUM_SEMESTER_REQUIRED');

  const { rows: [student] } = await client.query(`
    SELECT s."ProgramID" FROM "Students" s
    WHERE s."StudentID"=$1 AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' FOR UPDATE`, [studentId]);
  if (!student) throw invalid('Không tìm thấy sinh viên đang hoạt động.', 409, 'REGISTRATION_STUDENT_INACTIVE');

  const { rows: [course] } = await client.query(`
    SELECT pc."CourseID" FROM "ProgramCourses" pc
    JOIN "Courses" c USING ("CourseID")
    WHERE pc."ProgramID"=$1 AND pc."EntryKind"='COURSE'
      AND pc."RecommendedSemester"=6 AND upper(btrim(c."CourseCode"))='OJT202'
    ORDER BY pc."CourseID" LIMIT 1`, [student.ProgramID]);
  if (!course)
    throw invalid('Khung chương trình chưa ánh xạ môn OJT202 ở học kỳ 6.', 409, 'OJT202_CURRICULUM_MAPPING_REQUIRED');

  await client.query('SELECT pg_advisory_xact_lock(hashtext($1))', [`ojt202-enrollment:${studentId}:${target.AcademicPeriodID}`]);

  if ((await client.query(`SELECT 1 FROM "StudentCourseResults" history
    JOIN "Courses" c USING ("CourseID")
    WHERE history."StudentID"=$1 AND upper(btrim(c."CourseCode"))='OJT202' AND history."Status"='PASSED'
    LIMIT 1`, [studentId])).rowCount)
    throw invalid('Sinh viên đã đạt OJT202 nên không thể đăng ký đi OJT.', 409, 'OJT202_ALREADY_PASSED');

  const { rows: [existing] } = await client.query(`SELECT history."ResultID"
    FROM "StudentCourseResults" history
    JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=history."AcademicPeriodID"
    JOIN "Courses" existing_course ON existing_course."CourseID"=history."CourseID"
    WHERE history."StudentID"=$1 AND upper(btrim(existing_course."CourseCode"))='OJT202'
      AND COALESCE(period."ParentPeriodID",period."AcademicPeriodID")=$2
      AND history."Status"='IN_PROGRESS'
    ORDER BY history."AttemptNumber" DESC LIMIT 1`, [studentId, target.RootPeriodID]);
  if (existing) return { resultId: existing.ResultID, inserted: false };

  const { rows: [inserted] } = await client.query(`
    INSERT INTO "StudentCourseResults"
      ("StudentID","CourseID","SemesterTaken","AcademicYearID","Status","AcademicPeriodID","AttemptNumber","SourceReference","RecordedBy")
    SELECT $1,$2,$7,$3,'IN_PROGRESS',$4,
      COALESCE((SELECT max(history."AttemptNumber") FROM "StudentCourseResults" history
        JOIN "AcademicPeriods" previous_period ON previous_period."AcademicPeriodID"=history."AcademicPeriodID"
        JOIN "Courses" previous_course ON previous_course."CourseID"=history."CourseID"
        WHERE history."StudentID"=$1 AND upper(btrim(previous_course."CourseCode"))='OJT202'
          AND COALESCE(previous_period."ParentPeriodID",previous_period."AcademicPeriodID")=$5),0)+1,
      'AUTO_OJT_ENROLLMENT',$6
    WHERE NOT EXISTS (
      SELECT 1 FROM "StudentCourseResults" history
      JOIN "AcademicPeriods" period ON period."AcademicPeriodID"=history."AcademicPeriodID"
      JOIN "Courses" existing_course ON existing_course."CourseID"=history."CourseID"
      WHERE history."StudentID"=$1 AND upper(btrim(existing_course."CourseCode"))='OJT202'
        AND COALESCE(period."ParentPeriodID",period."AcademicPeriodID")=$5
        AND history."Status"='IN_PROGRESS'
    )
    AND NOT EXISTS (
      SELECT 1 FROM "StudentCourseResults" passed
      JOIN "Courses" passed_course ON passed_course."CourseID"=passed."CourseID"
      WHERE passed."StudentID"=$1 AND upper(btrim(passed_course."CourseCode"))='OJT202'
        AND passed."Status"='PASSED'
    )
    ON CONFLICT ("StudentID","CourseID","AcademicPeriodID","AttemptNumber")
      WHERE "AcademicPeriodID" IS NOT NULL DO NOTHING
    RETURNING "ResultID","AttemptNumber"`, [studentId, course.CourseID, target.AcademicYearID, target.AcademicPeriodID, target.RootPeriodID, actorId, relativeSemester]);

  if (!inserted) {
    if ((await client.query(`SELECT 1 FROM "StudentCourseResults" passed JOIN "Courses" course USING ("CourseID")
      WHERE passed."StudentID"=$1 AND upper(btrim(course."CourseCode"))='OJT202' AND passed."Status"='PASSED' LIMIT 1`, [studentId])).rowCount)
      throw invalid('Sinh viên đã đạt OJT202 nên không thể đăng ký đi OJT.', 409, 'OJT202_ALREADY_PASSED');
    const { rows: [replayed] } = await client.query(`SELECT history."ResultID"
      FROM "StudentCourseResults" history JOIN "Courses" existing_course USING ("CourseID")
      WHERE history."StudentID"=$1 AND upper(btrim(existing_course."CourseCode"))='OJT202'
        AND history."AcademicPeriodID"=$2 AND history."Status"='IN_PROGRESS'
      ORDER BY history."AttemptNumber" DESC LIMIT 1`, [studentId, target.AcademicPeriodID]);
    return { resultId: replayed?.ResultID ?? null, inserted: false };
  }

  await audit(client, actorId, 'StudentCourseResults', inserted.ResultID, 'RECORD_OJT202_IN_PROGRESS', null, {
    studentId, courseId: course.CourseID, semesterTaken: relativeSemester,
    academicYearId: target.AcademicYearID, academicPeriodId: target.AcademicPeriodID,
    attemptNumber: inserted.AttemptNumber,
    status: 'IN_PROGRESS', sourceReference: 'AUTO_OJT_ENROLLMENT',
  });
  return { resultId: inserted.ResultID, inserted: true };
}
