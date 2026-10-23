import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { metadata, inputObject, requiredText, optionalText, positiveId, credits, boolean, invalid, assertAcyclic } from './curriculum.validation';
import { detail } from './curriculum.repository';
import { normalizeCourses, normalizeCombo, normalizePrerequisites, normalizeEquivalences, validateComboCapacity, type Row } from './curriculum.structure';

export async function saveMajor(body:unknown,actorId:number) {
  const b=inputObject(body,['code','name','parentMajorId']);
  return academicTransaction(async client=>{
    const r=(await client.query(`INSERT INTO "Specializations" ("SpecializationCode","SpecializationName","MajorID") VALUES ($1,$2,$3) RETURNING "SpecializationID" AS id,"SpecializationCode" AS code,"SpecializationName" AS name,"MajorID" AS "parentMajorId"`,[requiredText(b.code,'code',20).toUpperCase(),requiredText(b.name,'name',200),positiveId(b.parentMajorId,'parentMajorId')])).rows[0];
    await audit(client,actorId,'Specializations',r.id,'CREATE_MAJOR',null,r);return r;
  });
}
export async function saveCourse(body:unknown,actorId:number,id?:number) {
  const b=inputObject(body,['code','name','defaultCredits','isOjtPrerequisite']);
  const fields:Record<string,unknown>={};
  if(!id||'code' in b)fields.CourseCode=requiredText(b.code,'code',20).toUpperCase();
  if(!id||'name' in b)fields.CourseName=requiredText(b.name,'name',200);
  if('defaultCredits' in b)fields.Credits=b.defaultCredits===null?null:credits(b.defaultCredits);
  if('isOjtPrerequisite' in b)fields.IsOJTPrerequisite=boolean(b.isOjtPrerequisite,'isOjtPrerequisite');
  return academicTransaction(async client=>{
    let before:Row|null=null;
    if(id){before=(await client.query('SELECT * FROM "Courses" WHERE "CourseID"=$1 FOR UPDATE',[id])).rows[0];if(!before)throw invalid('Course not found.',404,'COURSE_NOT_FOUND');
      if(fields.CourseCode!==undefined && fields.CourseCode!==before.CourseCode && (await client.query(`SELECT 1 FROM "StudentCourseResults" WHERE "CourseID"=$1 UNION ALL SELECT 1 FROM "ProgramCourses" pc JOIN "TrainingPrograms" p ON p."ProgramID"=pc."ProgramID" WHERE pc."CourseID"=$1 AND p."Status"='PUBLISHED' UNION ALL SELECT 1 FROM "ComboCourses" cc JOIN "ProgramCombos" b ON b."ProgramComboID"=cc."ProgramComboID" JOIN "TrainingPrograms" p ON p."ProgramID"=b."ProgramID" WHERE cc."CourseID"=$1 AND p."Status"='PUBLISHED' LIMIT 1`,[id])).rowCount)throw invalid('A course code with academic history or a published curriculum cannot be renamed.',409,'COURSE_IN_USE');
    }
    const entries=Object.entries(fields),args=entries.map(([,v])=>v);
    const sql=id?`UPDATE "Courses" SET ${entries.map(([k],i)=>`"${k}"=$${i+1}`).join(',')} WHERE "CourseID"=$${args.length+1}`:`INSERT INTO "Courses" (${entries.map(([k])=>`"${k}"`).join(',')}) VALUES (${entries.map((_,i)=>`$${i+1}`).join(',')})`;
    const r=(await client.query(sql+' RETURNING "CourseID" AS id,"CourseCode" AS code,"CourseName" AS name,"Credits"::float8 AS "defaultCredits","IsOJTPrerequisite" AS "isOjtPrerequisite"',id?[...args,id]:args)).rows[0];
    await audit(client,actorId,'Courses',r.id,id?'UPDATE_COURSE':'CREATE_COURSE',before,r);return r;
  });
}
export async function writeMetadata(client:PoolClient,body:unknown,actorId:number,id?:number) {
  const value=metadata(body,!!id),fields=value.fields;
  if(fields.SpecializationID!==undefined && !(await client.query('SELECT 1 FROM "Specializations" WHERE "SpecializationID"=$1',[fields.SpecializationID])).rowCount)throw invalid('majorId does not identify an existing specialization.');
  const entries=Object.entries(fields),args=entries.map(([,v])=>v);
  if(id) {
    if(entries.length)await client.query(`UPDATE "TrainingPrograms" SET ${entries.map(([k],i)=>`"${k}"=$${i+1}`).join(',')},"UpdatedAt"=now() WHERE "ProgramID"=$${args.length+1}`,[...args,id]);
  }else{
    id=(await client.query(`INSERT INTO "TrainingPrograms" (${entries.map(([k])=>`"${k}"`).join(',')},"CreatedBy","Status") VALUES (${entries.map((_,i)=>`$${i+1}`).join(',')},$${args.length+1},'DRAFT') RETURNING "ProgramID"`,[...args,actorId])).rows[0].ProgramID as number;
  }
  if(value.gpaScale!==undefined)await client.query(`INSERT INTO "AcademicGradingPolicies" ("ProgramID","GpaScale","RetakePolicy","ConfirmedBy") VALUES ($1,$2,'LATEST',$3) ON CONFLICT ("ProgramID") DO UPDATE SET "GpaScale"=EXCLUDED."GpaScale","RetakePolicy"='LATEST',"ConfirmedBy"=EXCLUDED."ConfirmedBy","ConfirmedAt"=now()`,[id,value.gpaScale,actorId]);
  return id;
}
export function comboMetadata(body:unknown) {
  const b=inputObject(body,['code','name','selectionGroup','note']);
  return {code:requiredText(b.code,'code',50).toUpperCase(),name:requiredText(b.name,'name',200),selectionGroup:optionalText(b.selectionGroup,'selectionGroup',50),note:optionalText(b.note,'note',2000)};
}
export async function insertCombo(client:PoolClient,id:number,b:Row) {
  return (await client.query(`INSERT INTO "ProgramCombos" ("ProgramID","ComboCode","ComboName","SelectionGroup","Note") VALUES ($1,$2,$3,$4,$5) RETURNING "ProgramComboID"`,[id,b.code,b.name,b.selectionGroup,b.note])).rows[0].ProgramComboID as number;
}
export async function publicationIssues(client:PoolClient,id:number) {
  return publicationIssuesForData(client,await detail(client,id));
}
export async function publicationIssuesForData(client:PoolClient,data:Row) {
  const issues:string[]=[];
  if(!data.version || !data.majorId || !data.effectiveYear)issues.push('Version, specialization and effective year must be defined.');
  if(!data.gpaScale || data.retakePolicy!=='LATEST')issues.push('Confirm GPA scale 4/10 and latest-attempt policy.');
  if(!data.courses.length)issues.push('Curriculum must contain courses.');
  if(!data.prerequisitesReviewed)issues.push('Review and set prerequisites explicitly (an empty array confirms no prerequisites).');
  if(!data.equivalencesReviewed)issues.push('Review and set course equivalences explicitly.');
  try{
    const normalized=await normalizeCourses(client,data.courses.map((c:Row)=>({courseId:c.courseId,credits:c.credits,semester:c.semester,isRequired:c.isRequired,entryKind:c.entryKind,prerequisiteText:c.prerequisiteText})));
    const aliases=await normalizeEquivalences(client,data.equivalences.map((e:Row)=>({sourceCourseId:e.sourceCourseId,targetCourseId:e.targetCourseId,reason:e.reason})),normalized,data.combos.flatMap((c:Row)=>c.courses));
    const mapping=new Map<number,number>(aliases.map(e=>[e.sourceCourseId,e.targetCourseId]));const canonical=(id:number)=>{while(mapping.has(id))id=mapping.get(id)!;return id;};
    const creditMap=new Map<number,number>();let total=0;
    for(const course of normalized)if(course.entryKind==='COURSE'){
      const key=canonical(course.courseId);if(creditMap.has(key)&&creditMap.get(key)!==course.credits)issues.push('Equivalent curriculum courses must have identical credit weights.');creditMap.set(key,course.credits);
    }else total+=course.credits;
    total+=[...creditMap.values()].reduce((sum,n)=>sum+n,0);
    if(Math.round(total*100)!==Math.round(data.totalCredits*100))issues.push('Total credits must equal deduplicated curriculum courses plus placeholder slots, without adding combo subjects again.');
    const comboCourses:Row[]=[];
    for(const combo of data.combos) {
      if(!combo.coursesReviewed || !combo.courses.length)issues.push(`Review courses and choice groups for combo ${combo.code}.`);
      const n=await normalizeCombo(client,{courses:combo.courses.map((c:Row)=>({courseId:c.courseId,credits:Number(c.credits),semester:c.semester,prerequisiteText:c.prerequisiteText,note:c.note,slotCourseIds:c.slotCourseIds})),choiceGroups:combo.choiceGroups},normalized);validateComboCapacity(n);comboCourses.push(...n.courses.filter((c:Row)=>n.choiceGroups.some((g:Row)=>g.maxCourses>0&&g.courseIds.includes(c.courseId))));
      if(n.courses.some((c:Row)=>!c.slotCourseIds.length))issues.push(`Every course in combo ${combo.code} must map to an explicit curriculum slot.`);
    }
    for(const slot of normalized.filter(c=>c.entryKind!=='COURSE'))if(!comboCourses.some(c=>c.slotCourseIds.includes(slot.courseId)))issues.push(`Slot ${slot.courseId} has no approved options.`);
    const prerequisites=normalizePrerequisites(data.prerequisites,normalized,comboCourses),canonicalEdges=new Map<number,Set<number>>();
    for(const group of prerequisites){
      const target=canonical(group.courseId),members=new Set<number>(group.prerequisiteCourseIds.map(canonical));
      if(members.size<group.minimumPassed)issues.push('Equivalent prerequisites cannot count as separate passed subjects within the same group.');
      canonicalEdges.set(target,new Set([...(canonicalEdges.get(target)??[]),...members]));
    }
    assertAcyclic(canonicalEdges,'Prerequisites after applying equivalences');
  }catch(error:any){if(!error.statusCode)throw error;issues.push(error.message);}
  return {data,issues:[...new Set(issues)]};
}
