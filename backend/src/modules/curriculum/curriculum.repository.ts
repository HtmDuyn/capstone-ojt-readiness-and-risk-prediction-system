import { enrichListRows } from '../../shared/list-context';
import type { PoolClient } from 'pg';
import { pool, query } from '../../config/database';
import { invalid, positiveId, requiredText, enumValue } from './curriculum.validation';
import { pagination } from '../students/student.validation';

export const curriculumSelect=`SELECT p."ProgramID" AS id,p."ProgramCode" AS code,p."ProgramName" AS name,(to_jsonb(p)->>'Version') AS version,p."SpecializationID" AS "majorId",s."SpecializationName" AS "majorName",s."SpecializationCode" AS "majorCode",p."TotalCredits"::float8 AS "totalCredits",(to_jsonb(p)->>'EffectiveYear')::int AS "effectiveYear",(to_jsonb(p)->>'Status') AS status,(to_jsonb(p)->>'PrerequisitesReviewed')::boolean AS "prerequisitesReviewed",(to_jsonb(p)->>'EquivalencesReviewed')::boolean AS "equivalencesReviewed",(to_jsonb(p)->>'CreatedBy')::int AS "createdBy",(to_jsonb(p)->>'CreatedAt') AS "createdAt",(to_jsonb(p)->>'UpdatedAt') AS "updatedAt",(to_jsonb(p)->>'PublishedBy')::int AS "publishedBy",(to_jsonb(p)->>'PublishedAt') AS "publishedAt",gp."GpaScale" AS "gpaScale",gp."RetakePolicy" AS "retakePolicy" FROM "TrainingPrograms" p LEFT JOIN "Specializations" s ON s."SpecializationID"=p."SpecializationID" LEFT JOIN "AcademicGradingPolicies" gp ON gp."ProgramID"=p."ProgramID"`;
export async function listCatalog(kind:'majors'|'courses'|'curricula',params:Record<string,unknown>) {
  const allowed=kind==='curricula'?['search','status','majorId']:kind==='majors'?['search','parentMajorId']:['search'];
  const p=pagination(params,allowed),args:unknown[]=[],filters:string[]=[];
  const select=kind==='curricula'?curriculumSelect:kind==='majors'?`SELECT s."SpecializationID" AS id,s."SpecializationCode" AS code,s."SpecializationName" AS name,s."MajorID" AS "parentMajorId",m."MajorCode" AS "parentMajorCode",m."MajorName" AS "parentMajorName" FROM "Specializations" s JOIN "AcademicMajors" m ON m."MajorID"=s."MajorID"`:`SELECT "CourseID" AS id,"CourseCode" AS code,"CourseName" AS name,"Credits"::float8 AS "defaultCredits","IsOJTPrerequisite" AS "isOjtPrerequisite" FROM "Courses"`;
  if(params.search!==undefined){args.push(`%${requiredText(params.search,'search',100)}%`);filters.push(`(code ILIKE $${args.length} OR name ILIKE $${args.length})`);}
  for(const key of ['status','majorId','parentMajorId'])if(params[key]!==undefined){args.push(key==='status'?enumValue(params[key],['DRAFT','PUBLISHED'],'status'):positiveId(params[key],key));filters.push(`"${key}"=$${args.length}`);}
  const row=(await query(`WITH catalog AS (${select}), filtered AS (SELECT * FROM catalog ${filters.length?'WHERE '+filters.join(' AND '):''}),paged AS (SELECT * FROM filtered ORDER BY id DESC LIMIT $${args.length+1} OFFSET $${args.length+2}) SELECT (SELECT count(*)::int FROM filtered) AS total,COALESCE(jsonb_agg(to_jsonb(paged) ORDER BY id DESC) FILTER (WHERE id IS NOT NULL),'[]'::jsonb) AS items FROM paged`,[...args,p.limit,p.offset])).rows[0];
  if(kind==='curricula'&&row.items.length){
    const details=(await query(`SELECT p."ProgramID" AS id,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',pc."ProgramCourseID",'courseId',pc."CourseID",'courseCode',c."CourseCode",
        'name',pc."CourseName",'credits',pc."Credits",'semester',pc."RecommendedSemester",'isRequired',pc."IsRequired",'entryKind',pc."EntryKind",'prerequisiteText',pc."PrerequisiteText")
        ORDER BY pc."RecommendedSemester",pc."ProgramCourseID") FROM "ProgramCourses" pc JOIN "Courses" c ON c."CourseID"=pc."CourseID" WHERE pc."ProgramID"=p."ProgramID"),'[]'::jsonb) AS courses,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('id',b."ProgramComboID",'code',b."ComboCode",'name',b."ComboName",'selectionGroup',b."SelectionGroup",'note',b."Note",'coursesReviewed',b."CoursesReviewed",
        'courses',COALESCE((SELECT jsonb_agg(jsonb_build_object('id',cc."ComboCourseID",'courseId',cc."CourseID",'courseCode',c."CourseCode",'name',cc."CourseName",'credits',cc."Credits",'semester',cc."Semester",'prerequisiteText',cc."PrerequisiteText",'note',cc."Note") ORDER BY cc."ComboCourseID")
          FROM "ComboCourses" cc JOIN "Courses" c ON c."CourseID"=cc."CourseID" WHERE cc."ProgramComboID"=b."ProgramComboID"),'[]'::jsonb)) ORDER BY b."ProgramComboID")
        FROM "ProgramCombos" b WHERE b."ProgramID"=p."ProgramID"),'[]'::jsonb) AS combos,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('courseId',pc."CourseID",'groupCode',g."GroupCode",'minimumPassed',g."MinimumPassed",
        'prerequisiteCourseIds',COALESCE((SELECT jsonb_agg(m."CourseID" ORDER BY m."CourseID") FROM "ProgramPrerequisiteMembers" m WHERE m."GroupID"=g."GroupID"),'[]'::jsonb))
        ORDER BY g."GroupID") FROM "ProgramPrerequisiteGroups" g JOIN "ProgramCourses" pc ON pc."ProgramCourseID"=g."ProgramCourseID" WHERE g."ProgramID"=p."ProgramID"),'[]'::jsonb) AS prerequisites,
      COALESCE((SELECT jsonb_agg(jsonb_build_object('sourceCourseId',e."SourceCourseID",'targetCourseId',e."TargetCourseID",'reason',e."Reason",'confirmedBy',e."ConfirmedBy",'confirmedAt',e."ConfirmedAt")
        ORDER BY e."SourceCourseID") FROM "ProgramCourseEquivalences" e WHERE e."ProgramID"=p."ProgramID"),'[]'::jsonb) AS equivalences
      FROM "TrainingPrograms" p WHERE p."ProgramID"=ANY($1::int[])`,[row.items.map((item:Record<string,any>)=>item.id)])).rows;
    const byId=new Map(details.map(item=>[item.id,item]));
    row.items=row.items.map((item:Record<string,any>)=>({...item,...byId.get(item.id)}));
  }
  return {...row,items:await enrichListRows({query},row.items),page:p.page,limit:p.limit};
}
export async function curriculumRecord(client:PoolClient,id:number) {
  const row=(await client.query(`${curriculumSelect} WHERE p."ProgramID"=$1`,[id])).rows[0];
  if(!row)throw invalid('Curriculum not found.',404,'CURRICULUM_NOT_FOUND');
  return row;
}
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
