import type { PoolClient } from 'pg';
import { loadAcademicProgress,progressFromData } from '../students/academic-progress';
import { buildCoursePlan } from './course-plan';

export async function loadCoursePlanData(c:PoolClient,studentId:number) {
  const data=await loadAcademicProgress(c,studentId),progress=progressFromData(data);
  const groups=(await c.query(`SELECT g."ProgramCourseID" AS "requirementId",g."MinimumPassed" AS "minimumPassed",
    COALESCE(jsonb_agg(m."CourseID") FILTER(WHERE m."CourseID" IS NOT NULL),'[]'::jsonb) AS "courseIds"
    FROM "ProgramPrerequisiteGroups" g LEFT JOIN "ProgramPrerequisiteMembers" m ON m."GroupID"=g."GroupID"
    WHERE g."ProgramID"=$1 GROUP BY g."GroupID"`,[data.program?.ProgramID])).rows;
  const ids=[...new Set<number>([...progress.requirements.flatMap(r=>r.choices),...groups.flatMap(g=>g.courseIds),...data.aliases.flatMap(a=>[a.SourceCourseID,a.TargetCourseID])])];
  const catalog=(await c.query('SELECT "CourseID" AS "courseId","CourseCode" AS "courseCode","CourseName" AS name FROM "Courses" WHERE "CourseID"=ANY($1::int[])',[ids])).rows;
  return {data,progress,groups,catalog,valid:!!progress.credits.completeConfiguration&&data.program?.PrerequisitesReviewed===true&&data.program?.Status==='PUBLISHED'};
}
export async function coursePlanWithClient(c:PoolClient,studentId:number) {
  const {data,progress,groups,catalog,valid}=await loadCoursePlanData(c,studentId);
  const requirements=progress.requirements.map(r=>({...r,
    recommendedSemester:data.courses.find(course=>course.ProgramCourseID===r.id)?.RecommendedSemester??null}));
  return buildCoursePlan({requirements,attempts:data.attempts,groups,aliases:data.aliases,catalog,valid});
}

