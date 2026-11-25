import type { PoolClient } from 'pg';
import { loadAcademicProgress,progressFromData } from '../students/academic-progress';
import { buildCoursePlan } from './course-plan';
import type { AssessmentReadContext } from './assessment-read-context';

export async function loadCoursePlanData(c:PoolClient,studentId:number,assessment?:AssessmentReadContext) {
  // Only reuse the source loaded for this owner in the current transaction.
  const data=assessment?.source?.studentId===studentId?assessment.source:await loadAcademicProgress(c,studentId);
  const progress=progressFromData(data,false,false);
  const groups=(assessment?.source===data?assessment.prerequisiteGroups:undefined)??(await c.query(`SELECT g."ProgramCourseID" AS "requirementId",g."MinimumPassed" AS "minimumPassed",
    COALESCE(jsonb_agg(m."CourseID") FILTER(WHERE m."CourseID" IS NOT NULL),'[]'::jsonb) AS "courseIds"
    FROM "ProgramPrerequisiteGroups" g LEFT JOIN "ProgramPrerequisiteMembers" m ON m."GroupID"=g."GroupID"
    WHERE g."ProgramID"=$1 GROUP BY g."GroupID"`,[data.program?.ProgramID])).rows;
  const ids=[...new Set<number>([...progress.requirements.flatMap(r=>r.choices),...groups.flatMap(g=>g.courseIds),...data.aliases.flatMap(a=>[a.SourceCourseID,a.TargetCourseID])])];
  const catalog=(await c.query('SELECT "CourseID" AS "courseId","CourseCode" AS "courseCode","CourseName" AS name FROM "Courses" WHERE "CourseID"=ANY($1::int[])',[ids])).rows;
  return {data,progress,groups,catalog,valid:!!progress.credits.completeConfiguration&&data.program?.Status==='PUBLISHED'};
}
export async function coursePlanWithClient(c:PoolClient,studentId:number,assessment?:AssessmentReadContext) {
  const {data,progress,groups,catalog,valid}=await loadCoursePlanData(c,studentId,assessment);
  const requirements=progress.requirements.filter(r=>r.choices.length>0).map(r=>({...r,
    recommendedSemester:data.courses.find(course=>course.ProgramCourseID===r.id)?.RecommendedSemester??null}));
  return buildCoursePlan({requirements,attempts:data.attempts,groups,aliases:data.aliases,catalog,valid});
}

