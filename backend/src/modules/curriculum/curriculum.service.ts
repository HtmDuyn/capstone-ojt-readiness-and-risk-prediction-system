import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { metadata, inputObject, requiredText, optionalText, positiveId, credits, boolean, invalid, assertAcyclic } from './curriculum.validation';
import { editable, touch, detail, curriculumRecord } from './curriculum.repository';
import { normalizeCourses, normalizeCombo, scopeCourses, normalizePrerequisites, normalizeEquivalences, writeCourses, writePrerequisites, writeEquivalences, writeComboCourses, validateComboCapacity, type Row } from './curriculum.structure';

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
    id=(await client.query(`INSERT INTO "TrainingPrograms" (${entries.map(([k])=>`"${k}"`).join(',')},"CreatedBy") VALUES (${entries.map((_,i)=>`$${i+1}`).join(',')},$${args.length+1}) RETURNING "ProgramID"`,[...args,actorId])).rows[0].ProgramID as number;
  }
  if(value.gpaScale!==undefined)await client.query(`INSERT INTO "AcademicGradingPolicies" ("ProgramID","GpaScale","RetakePolicy","ConfirmedBy") VALUES ($1,$2,'LATEST',$3) ON CONFLICT ("ProgramID") DO UPDATE SET "GpaScale"=EXCLUDED."GpaScale","RetakePolicy"='LATEST',"ConfirmedBy"=EXCLUDED."ConfirmedBy","ConfirmedAt"=now()`,[id,value.gpaScale,actorId]);
  return id;
}
export async function saveCurriculum(body:unknown,actorId:number,id?:number) {
  return academicTransaction(async client=>{
    const before=id?await editable(client,id):null;
    const savedId=await writeMetadata(client,body,actorId,id);await touch(client,savedId);const after=await curriculumRecord(client,savedId);
    await audit(client,actorId,'TrainingPrograms',savedId,id?'UPDATE_CURRICULUM':'CREATE_CURRICULUM',before,after);return after;
  });
}
export function comboMetadata(body:unknown) {
  const b=inputObject(body,['code','name','selectionGroup','note']);
  return {code:requiredText(b.code,'code',50).toUpperCase(),name:requiredText(b.name,'name',200),selectionGroup:optionalText(b.selectionGroup,'selectionGroup',50),note:optionalText(b.note,'note',2000)};
}
export async function insertCombo(client:PoolClient,id:number,b:Row) {
  return (await client.query(`INSERT INTO "ProgramCombos" ("ProgramID","ComboCode","ComboName","SelectionGroup","Note") VALUES ($1,$2,$3,$4,$5) RETURNING "ProgramComboID"`,[id,b.code,b.name,b.selectionGroup,b.note])).rows[0].ProgramComboID as number;
}
export async function createCombo(id:number,body:unknown,actorId:number) {
  const b=comboMetadata(body);
  return academicTransaction(async client=>{await editable(client,id);const comboId=await insertCombo(client,id,b);await touch(client,id);const after={id:comboId,curriculumId:id,...b};await audit(client,actorId,'ProgramCombos',comboId,'CREATE_COMBO',null,after);return after;});
}
export async function replaceStructure(id:number,kind:'courses'|'prerequisites'|'equivalences',body:unknown,actorId:number) {
  const b=inputObject(body,[kind]);
  return academicTransaction(async client=>{
    await editable(client,id);const before=await detail(client,id),scope=await scopeCourses(client,id);
    if(kind==='courses') {
      const normalized=await normalizeCourses(client,b.courses);
      // A retained slot must remain a slot while mapped combo courses exist.
      for(const row of normalized)if(row.entryKind==='COURSE' && scope.program.some(p=>p.courseId===row.courseId && p.entryKind!=='COURSE') && (await client.query(`SELECT 1 FROM "ProgramSlotOptions" opt JOIN "ProgramCourses" pc ON pc."ProgramCourseID"=opt."ProgramCourseID" WHERE pc."ProgramID"=$1 AND pc."CourseID"=$2 LIMIT 1`,[id,row.courseId])).rowCount)throw invalid('Remove combo slot mappings before converting a slot to an actual course.',409);
      await writeCourses(client,id,normalized);
      await client.query('UPDATE "TrainingPrograms" SET "PrerequisitesReviewed"=false,"EquivalencesReviewed"=false WHERE "ProgramID"=$1',[id]);
      await client.query('UPDATE "ProgramCombos" SET "CoursesReviewed"=false WHERE "ProgramID"=$1',[id]);
    }else if(kind==='prerequisites')await writePrerequisites(client,id,normalizePrerequisites(b.prerequisites,scope.program,scope.combo));
    else await writeEquivalences(client,id,await normalizeEquivalences(client,b.equivalences,scope.program,scope.combo),actorId);
    await touch(client,id);const after=await detail(client,id);await audit(client,actorId,'TrainingPrograms',id,`REPLACE_${kind.toUpperCase()}`,before,after);return after;
  });
}
export async function replaceCombo(id:number,body:unknown,actorId:number) {
  return academicTransaction(async client=>{
    const combo=(await client.query('SELECT "ProgramID" FROM "ProgramCombos" WHERE "ProgramComboID"=$1',[id])).rows[0];if(!combo)throw invalid('Combo not found.',404,'COMBO_NOT_FOUND');
    const programId=combo.ProgramID;await editable(client,programId);const before=await detail(client,programId),scope=await scopeCourses(client,programId);
    const value=await normalizeCombo(client,body,scope.program);await writeComboCourses(client,programId,id,value);
    await client.query('UPDATE "TrainingPrograms" SET "PrerequisitesReviewed"=false,"EquivalencesReviewed"=false WHERE "ProgramID"=$1',[programId]);
    await touch(client,programId);const after=await detail(client,programId);await audit(client,actorId,'ProgramCombos',id,'REPLACE_COMBO_COURSES',before.combos.find((c:Row)=>c.id===id),after.combos.find((c:Row)=>c.id===id));return after.combos.find((c:Row)=>c.id===id);
  });
}
export async function publicationIssues(client:PoolClient,id:number) {
  const data=await detail(client,id),issues:string[]=[];
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
export async function publishCurriculum(id:number,actorId:number,body:unknown) {
  const b=inputObject(body,['reason']);const reason=requiredText(b.reason,'reason',2000);
  return academicTransaction(async client=>{
    const row=(await client.query('SELECT "Status" FROM "TrainingPrograms" WHERE "ProgramID"=$1 FOR UPDATE',[id])).rows[0];if(!row)throw invalid('Curriculum not found.',404,'CURRICULUM_NOT_FOUND');
    if(row.Status==='PUBLISHED')return {published:true,replayed:true,data:await detail(client,id)};
    const check=await publicationIssues(client,id);if(check.issues.length)return {published:false,issues:check.issues};
    await client.query(`UPDATE "TrainingPrograms" SET "Status"='PUBLISHED',"PublishedBy"=$2,"PublishedAt"=now(),"UpdatedAt"=now() WHERE "ProgramID"=$1`,[id,actorId]);
    const after=await detail(client,id);await audit(client,actorId,'TrainingPrograms',id,'PUBLISH_CURRICULUM',check.data,after,reason);return {published:true,replayed:false,data:after};
  });
}
