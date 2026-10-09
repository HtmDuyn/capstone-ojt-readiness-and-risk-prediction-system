import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';
import { resultPeriod } from '../students/student.service';
import { audit } from '../academic/academic.repository';
import { relativeSemester,actualPeriod,periodBounds,dayString } from '../academic/workflow-policy';
type Row=Record<string,any>;
export async function syncOfficialGrade(c:PoolClient,result:Row,actor:number,reason:string) {
 const context=(await c.query(`SELECT s."ProgramID",r."ProgramID" AS "RegistrationProgramID",p."Status" AS "ProgramStatus",g."GpaScale"
  FROM "InternshipAssignments" a JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
  JOIN "OJTRegistrations" r ON r."RegistrationID"=co."RegistrationID" JOIN "Students" s ON s."StudentID"=r."StudentID"
  LEFT JOIN "TrainingPrograms" p ON p."ProgramID"=s."ProgramID" LEFT JOIN "AcademicGradingPolicies" g ON g."ProgramID"=s."ProgramID"
  WHERE a."AssignmentID"=$1 FOR UPDATE OF s`,[result.AssignmentID])).rows[0];
 if(!context?.RegistrationProgramID||context.ProgramID!==context.RegistrationProgramID||context.ProgramStatus!=='PUBLISHED'||!context.GpaScale)
  throw invalid('The registration must retain the student’s published curriculum and GPA policy. Reconcile legacy or changed curriculum data first.',409,'OJT_RESULT_CURRICULUM_MISMATCH');
 const m=(await c.query('SELECT * FROM "ProgramOJTGradeMappings" WHERE "ProgramID"=$1 AND "OJTSemesterID"=$2 FOR UPDATE',[context.ProgramID,result.OJTSemesterID])).rows[0];
 if(!m)throw invalid('Configure and confirm the OJT course/period/grade conversion mapping before confirmation.',409,'OJT_GRADE_MAPPING_REQUIRED');
 if(!(await c.query(`SELECT 1 FROM "ProgramCourses" WHERE "ProgramID"=$1 AND "CourseID"=$2 AND "EntryKind"='COURSE'`,[context.ProgramID,m.CourseID])).rowCount)throw invalid('Configured OJT course is no longer a curriculum course.',409);
 const period=await actualPeriod(c,m.AcademicPeriodID),term=(await c.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[result.OJTSemesterID])).rows[0];
 if(period.AcademicYearID!==term.AcademicYearID||(term.StartDate&&periodBounds(period).end<=new Date(dayString(term.StartDate)+'T00:00:00+07:00')))throw invalid('OJT grade period no longer matches the OJT academic year or dates.',409);
 await relativeSemester(c,result.StudentID,m.AcademicPeriodID);
 const band=[...m.GradeBands].sort((a,b)=>b.minimumScore-a.minimumScore).find(b=>Number(result.OfficialScore)>=b.minimumScore);
 if(!band||band.outcome!==result.Outcome||(context.GpaScale===4&&band.gradePoints==null))throw invalid('Official score/outcome does not match the explicitly configured grade conversion.',409,'OJT_GRADE_CONVERSION_CONFLICT');
 if((await c.query('SELECT 1 FROM "StudentCourseResults" WHERE "StudentID"=$1 AND "CourseID"=$2 AND "AcademicPeriodID"=$3',[result.StudentID,m.CourseID,m.AcademicPeriodID])).rowCount)
  throw invalid('A result already exists for this course and period. Reconcile it before synchronizing OJT; no manual result is overwritten.',409,'OJT_COURSE_RESULT_CONFLICT');
 const attempt=(await c.query('SELECT COALESCE(max("AttemptNumber"),0)+1 AS n FROM "StudentCourseResults" WHERE "StudentID"=$1 AND "CourseID"=$2',[result.StudentID,m.CourseID])).rows[0].n;
 if(attempt>100)throw invalid('Maximum course attempt number exceeded.',409);
 const actual=await resultPeriod(c,result.StudentID,m.AcademicPeriodID);
 const row=(await c.query(`INSERT INTO "StudentCourseResults" ("StudentID","CourseID","AcademicPeriodID","AttemptNumber","Status","Score","GradePoints","Grade","SourceReference","AcademicYearID","SemesterTaken","RecordedBy","OJTResultID")
  VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13) RETURNING *`,[result.StudentID,m.CourseID,m.AcademicPeriodID,attempt,result.Outcome,result.OfficialScore,band.gradePoints,band.grade,`OJT_RESULT:${result.ResultID}`,actual.academicYearId,actual.semesterTaken,actor,result.ResultID])).rows[0];
 await audit(c,actor,'StudentCourseResults',row.ResultID,'SYNC_OFFICIAL_OJT_GRADE',null,row,reason);
 return {courseResultId:row.ResultID,mappingId:m.MappingID,mappingSnapshot:m};
}
