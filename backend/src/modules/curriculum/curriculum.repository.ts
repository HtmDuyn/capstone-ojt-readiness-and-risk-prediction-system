import type { PoolClient } from 'pg';
import { pool, query } from '../../config/database';
import { invalid, positiveId, requiredText, enumValue } from './curriculum.validation';
import { pagination } from '../students/student.validation';

export const curriculumSelect=`SELECT p."ProgramID" AS id,p."ProgramCode" AS code,p."ProgramName" AS name,p."Version" AS version,p."SpecializationID" AS "majorId",s."SpecializationName" AS "majorName",p."TotalCredits"::float8 AS "totalCredits",p."EffectiveYear" AS "effectiveYear",p."Status" AS status,p."PrerequisitesReviewed" AS "prerequisitesReviewed",p."EquivalencesReviewed" AS "equivalencesReviewed",p."CreatedBy" AS "createdBy",p."CreatedAt" AS "createdAt",p."UpdatedAt" AS "updatedAt",p."PublishedBy" AS "publishedBy",p."PublishedAt" AS "publishedAt",gp."GpaScale" AS "gpaScale",gp."RetakePolicy" AS "retakePolicy" FROM "TrainingPrograms" p LEFT JOIN "Specializations" s ON s."SpecializationID"=p."SpecializationID" LEFT JOIN "AcademicGradingPolicies" gp ON gp."ProgramID"=p."ProgramID"`;
export async function listCatalog(kind:'majors'|'courses'|'curricula',params:Record<string,unknown>) {
  const allowed=kind==='curricula'?['search','status','majorId','version']:kind==='majors'?['search','parentMajorId']:['search'];
  const p=pagination(params,allowed),args:unknown[]=[],filters:string[]=[];
  const select=kind==='curricula'?curriculumSelect:kind==='majors'?`SELECT s."SpecializationID" AS id,s."SpecializationCode" AS code,s."SpecializationName" AS name,s."MajorID" AS "parentMajorId",m."MajorCode" AS "parentMajorCode",m."MajorName" AS "parentMajorName" FROM "Specializations" s JOIN "AcademicMajors" m ON m."MajorID"=s."MajorID"`:`SELECT "CourseID" AS id,"CourseCode" AS code,"CourseName" AS name,"Credits"::float8 AS "defaultCredits","IsOJTPrerequisite" AS "isOjtPrerequisite" FROM "Courses"`;
  if(params.search!==undefined){args.push(`%${requiredText(params.search,'search',100)}%`);filters.push(`(code ILIKE $${args.length} OR name ILIKE $${args.length})`);}
  for(const key of ['status','majorId','parentMajorId','version'])if(params[key]!==undefined){args.push(key==='status'?enumValue(params[key],['DRAFT','PUBLISHED'],'status'):key==='version'?requiredText(params[key],'version',10):positiveId(params[key],key));filters.push(`"${key}"=$${args.length}`);}
  const row=(await query(`WITH catalog AS (${select}), filtered AS (SELECT * FROM catalog ${filters.length?'WHERE '+filters.join(' AND '):''}),paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
  return {...row,page:p.page,limit:p.limit};
}
export async function curriculumRecord(client:PoolClient,id:number) {
  const row=(await client.query(`${curriculumSelect} WHERE p."ProgramID"=$1`,[id])).rows[0];
  if(!row)throw invalid('Curriculum not found.',404,'CURRICULUM_NOT_FOUND');
  return row;
}
export async function editable(client:PoolClient,id:number) {
  const row=(await client.query('SELECT * FROM "TrainingPrograms" WHERE "ProgramID"=$1 FOR UPDATE',[id])).rows[0];
  if(!row)throw invalid('Curriculum not found.',404,'CURRICULUM_NOT_FOUND');
  if(row.Status!=='DRAFT')throw invalid('Published curricula are immutable. Create a new version.',409,'CURRICULUM_PUBLISHED');
  if((await client.query('SELECT 1 FROM "Students" WHERE "ProgramID"=$1 LIMIT 1',[id])).rowCount)throw invalid('This curriculum is assigned to students. Create a new version to preserve their academic history.',409,'CURRICULUM_IN_USE');
  return row;
}
export async function touch(client:PoolClient,id:number){await client.query('UPDATE "TrainingPrograms" SET "UpdatedAt"=now() WHERE "ProgramID"=$1',[id]);}
export async function combos(client:PoolClient,id:number) {
  return (await client.query(`SELECT b."ProgramComboID" AS id,b."ComboCode" AS code,b."ComboName" AS name,b."SelectionGroup" AS "selectionGroup",b."Note" AS note,b."CoursesReviewed" AS "coursesReviewed",COALESCE((SELECT jsonb_agg(jsonb_build_object('id',c."ComboCourseID",'courseId',c."CourseID",'courseCode',catalog."CourseCode",'name',c."CourseName",'credits',c."Credits",'semester',c."Semester",'prerequisiteText',c."PrerequisiteText",'note',c."Note",'slotCourseIds',COALESCE((SELECT jsonb_agg(pc."CourseID" ORDER BY pc."CourseID") FROM "ProgramSlotOptions" opt JOIN "ProgramCourses" pc ON pc."ProgramCourseID"=opt."ProgramCourseID" WHERE opt."ComboCourseID"=c."ComboCourseID"),'[]'::jsonb)) ORDER BY c."ComboCourseID") FROM "ComboCourses" c JOIN "Courses" catalog ON catalog."CourseID"=c."CourseID" WHERE c."ProgramComboID"=b."ProgramComboID"),'[]'::jsonb) AS courses,COALESCE((SELECT jsonb_agg(jsonb_build_object('code',g."GroupCode",'minCourses',g."MinCourses",'maxCourses',g."MaxCourses",'courseIds',COALESCE((SELECT jsonb_agg(cc."CourseID" ORDER BY cc."CourseID") FROM "ComboCourseChoiceMembers" m JOIN "ComboCourses" cc ON cc."ComboCourseID"=m."ComboCourseID" WHERE m."ChoiceGroupID"=g."ChoiceGroupID"),'[]'::jsonb)) ORDER BY g."ChoiceGroupID") FROM "ComboCourseChoiceGroups" g WHERE g."ProgramComboID"=b."ProgramComboID"),'[]'::jsonb) AS "choiceGroups" FROM "ProgramCombos" b WHERE b."ProgramID"=$1 ORDER BY b."ProgramComboID"`,[id])).rows;
}
export async function detail(client:PoolClient,id:number) {
  const record=await curriculumRecord(client,id);
  const courses=(await client.query(`SELECT pc."ProgramCourseID" AS id,pc."CourseID" AS "courseId",c."CourseCode" AS "courseCode",pc."CourseName" AS name,pc."Credits"::float8 AS credits,pc."RecommendedSemester" AS semester,pc."IsRequired" AS "isRequired",pc."EntryKind" AS "entryKind",pc."PrerequisiteText" AS "prerequisiteText" FROM "ProgramCourses" pc JOIN "Courses" c ON c."CourseID"=pc."CourseID" WHERE pc."ProgramID"=$1 ORDER BY pc."RecommendedSemester",pc."ProgramCourseID"`,[id])).rows;
  const prerequisites=(await client.query(`SELECT pc."CourseID" AS "courseId",g."GroupCode" AS "groupCode",g."MinimumPassed" AS "minimumPassed",COALESCE(jsonb_agg(m."CourseID" ORDER BY m."CourseID") FILTER (WHERE m."CourseID" IS NOT NULL),'[]'::jsonb) AS "prerequisiteCourseIds" FROM "ProgramPrerequisiteGroups" g JOIN "ProgramCourses" pc ON pc."ProgramCourseID"=g."ProgramCourseID" LEFT JOIN "ProgramPrerequisiteMembers" m ON m."GroupID"=g."GroupID" WHERE g."ProgramID"=$1 GROUP BY pc."CourseID",g."GroupID" ORDER BY pc."CourseID",g."GroupCode"`,[id])).rows;
  const equivalences=(await client.query(`SELECT "SourceCourseID" AS "sourceCourseId","TargetCourseID" AS "targetCourseId","Reason" AS reason,"ConfirmedBy" AS "confirmedBy","ConfirmedAt" AS "confirmedAt" FROM "ProgramCourseEquivalences" WHERE "ProgramID"=$1 ORDER BY "SourceCourseID"`,[id])).rows;
  return {...record,courses,prerequisites,combos:await combos(client,id),equivalences};
}
export async function readDetail(id:number) {
  if(!pool)throw invalid('Database is unavailable.',503);
  const client=await pool.connect();
  try{await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');const data=await detail(client,id);await client.query('COMMIT');return data;}catch(error){await client.query('ROLLBACK');throw error;}finally{client.release();}
}
