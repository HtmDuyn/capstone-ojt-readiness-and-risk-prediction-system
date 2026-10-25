import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { recordRejected, saveHistory } from '../students/academic-import.service';
import { array, inputObject, requiredText, optionalText, metadata, unique, invalid } from './curriculum.validation';
import { normalizeCourses, normalizeCombo, normalizePrerequisites, normalizeEquivalences, writeCourses, writeComboCourses, writePrerequisites, writeEquivalences, type Row } from './curriculum.structure';
import { comboMetadata, insertCombo, writeMetadata, publicationIssues, publicationIssuesForData } from './curriculum.service';
import { detail } from './curriculum.repository';
import type { ImportCommitHook } from '../imports/import.service';

async function prepare(client:PoolClient,body:unknown) {
  const b=inputObject(body,['idempotencyKey','sourceName','curriculum','courses','prerequisites','combos','equivalences']);
  const key=requiredText(b.idempotencyKey,'idempotencyKey',100),sourceName=optionalText(b.sourceName,'sourceName',150),meta=metadata(b.curriculum);
  if(!(await client.query('SELECT 1 FROM "Specializations" WHERE "SpecializationID"=$1',[meta.fields.SpecializationID])).rowCount)throw invalid('Unknown curriculum majorId.');
  const courses=await normalizeCourses(client,b.courses),combos:Row[]=[];
  for(const raw of array(b.combos,'combos',100)) {
    const c=inputObject(raw,['code','name','selectionGroup','note','courses','choiceGroups']);
    const m=comboMetadata({code:c.code,name:c.name,selectionGroup:c.selectionGroup,note:c.note});
    combos.push({...m,...await normalizeCombo(client,{courses:c.courses,choiceGroups:c.choiceGroups},courses)});
  }
  unique(combos.map(c=>c.code),'combo code');
  const comboCourses=combos.flatMap(c=>c.courses),prerequisites=normalizePrerequisites(b.prerequisites,courses,comboCourses),equivalences=await normalizeEquivalences(client,b.equivalences,courses,comboCourses);
  const publication=await publicationIssuesForData(client,{
    majorId:meta.fields.SpecializationID,effectiveYear:meta.fields.EffectiveYear,
    totalCredits:meta.fields.TotalCredits,gpaScale:meta.gpaScale,retakePolicy:'LATEST',
    prerequisitesReviewed:true,equivalencesReviewed:true,courses,prerequisites,equivalences,
    combos:combos.map(combo=>({...combo,coursesReviewed:true})),
  });
  if(publication.issues.length)throw Object.assign(invalid('Khung chương trình chưa đủ điều kiện công bố: '+publication.issues.join('; '),422,'CURRICULUM_PUBLICATION_INVALID'),{issues:publication.issues});
  const existing=(await client.query('SELECT "ProgramID" FROM "TrainingPrograms" WHERE upper("ProgramCode")=upper($1) FOR UPDATE',[meta.fields.ProgramCode])).rows;
  if(existing.length>1)throw invalid('Multiple curricula share this code.',409,'CURRICULUM_CODE_AMBIGUOUS');
  if(existing[0]){
    const oldCombos=(await client.query('SELECT "ProgramComboID","ComboCode" FROM "ProgramCombos" WHERE "ProgramID"=$1',[existing[0].ProgramID])).rows;
    for(const old of oldCombos){
      const next=combos.find(c=>c.code===old.ComboCode.toUpperCase());
      if(!next&&(await client.query('SELECT 1 FROM "StudentComboSelections" WHERE "ProgramComboID"=$1 LIMIT 1',[old.ProgramComboID])).rowCount)throw invalid('Cannot remove a combo selected by students.',409,'CURRICULUM_COMBO_IN_USE');
      if((await client.query('SELECT 1 FROM "StudentComboCourseSelections" s JOIN "ComboCourses" c ON c."ComboCourseID"=s."ComboCourseID" WHERE c."ProgramComboID"=$1 AND NOT(c."CourseID"=ANY($2::int[])) LIMIT 1',[old.ProgramComboID,next?.courses.map((row:Row)=>row.courseId)??[]])).rowCount)throw invalid('Cannot remove a combo course selected by students.',409,'CURRICULUM_COMBO_COURSE_IN_USE');
    }
  }
  return {key,sourceName,curriculum:b.curriculum,courses,combos,prerequisites,equivalences,existingId:existing[0]?.ProgramID as number|undefined};
}
export async function importCurriculum(body:unknown,actorId:number,preview:boolean,onCommit?:ImportCommitHook) {
  try {
    const b=inputObject(body,['idempotencyKey','sourceName','curriculum','courses','prerequisites','combos','equivalences']);
    const key=requiredText(b.idempotencyKey,'idempotencyKey',100),hash=createHash('sha256').update(JSON.stringify({sourceName:b.sourceName??null,curriculum:b.curriculum,courses:b.courses,prerequisites:b.prerequisites,combos:b.combos,equivalences:b.equivalences})).digest('hex');
    return await academicTransaction(async client=>{
      if(!preview){const old=(await client.query(`SELECT * FROM "AcademicImportBatches" WHERE "Kind"='CURRICULUM' AND "Status"='COMPLETED' AND "IdempotencyKey"=$1`,[key])).rows[0];if(old){if(old.PayloadHash!==hash||old.ImportedBy!==actorId)throw invalid('Idempotency key belongs to another payload or actor.',409,'IMPORT_CONFLICT');const result={...old.Summary,batchId:old.BatchID,replayed:true};if(onCommit)await onCommit(client,result);return result;}}
      const p=await prepare(client,body);
      const summary={courseCount:p.courses.length,comboCount:p.combos.length,prerequisiteGroupCount:p.prerequisites.length,equivalenceCount:p.equivalences.length,canCommit:true,action:p.existingId?'REPLACE':'CREATE',curriculumId:p.existingId??null,status:'PUBLISHED'};
      if(preview)return {...summary,preview:true,normalized:p};
      const before=p.existingId?await detail(client,p.existingId):null;
      // Reopen before editing metadata/children guarded by publication triggers.
      if(p.existingId)await client.query(`UPDATE "TrainingPrograms" SET "Status"='DRAFT',"PublishedBy"=NULL,"PublishedAt"=NULL,"UpdatedAt"=now() WHERE "ProgramID"=$1`,[p.existingId]);
      const id=await writeMetadata(client,p.curriculum,actorId,p.existingId);
      await client.query('DELETE FROM "ProgramSlotOptions" WHERE "ProgramID"=$1',[id]);
      await writePrerequisites(client,id,[]);
      const oldCombos=(await client.query('SELECT "ProgramComboID", "ComboCode" FROM "ProgramCombos" WHERE "ProgramID"=$1',[id])).rows;
      for(const old of oldCombos)if(!p.combos.some(c=>c.code===old.ComboCode.toUpperCase())){
        if((await client.query('SELECT 1 FROM "StudentComboSelections" WHERE "ProgramComboID"=$1 LIMIT 1',[old.ProgramComboID])).rowCount)throw invalid('Cannot remove a combo selected by students.',409,'CURRICULUM_COMBO_IN_USE');
        await writeComboCourses(client,id,old.ProgramComboID,{courses:[],choiceGroups:[]});
        await client.query('DELETE FROM "ProgramCombos" WHERE "ProgramComboID"=$1',[old.ProgramComboID]);
      }
      await writeCourses(client,id,p.courses);
      for(const c of p.combos){
        const old=oldCombos.find(row=>row.ComboCode.toUpperCase()===c.code);
        const comboId=old?.ProgramComboID??await insertCombo(client,id,c);
        if(old)await client.query('UPDATE "ProgramCombos" SET "ComboName"=$2,"SelectionGroup"=$3,"Note"=$4 WHERE "ProgramComboID"=$1',[comboId,c.name,c.selectionGroup,c.note]);
        if((await client.query('SELECT 1 FROM "StudentComboCourseSelections" s JOIN "ComboCourses" c ON c."ComboCourseID"=s."ComboCourseID" WHERE c."ProgramComboID"=$1 AND NOT(c."CourseID"=ANY($2::int[])) LIMIT 1',[comboId,c.courses.map((row:Row)=>row.courseId)])).rowCount)throw invalid('Cannot remove a combo course selected by students.',409,'CURRICULUM_COMBO_COURSE_IN_USE');
        await writeComboCourses(client,id,comboId,c);
      }
      await writePrerequisites(client,id,p.prerequisites);await writeEquivalences(client,id,p.equivalences,actorId);
      const publication=await publicationIssues(client,id);
      if(publication.issues.length)throw Object.assign(invalid('Khung chương trình chưa đủ điều kiện công bố: '+publication.issues.join('; '),422,'CURRICULUM_PUBLICATION_INVALID'),{issues:publication.issues});
      await client.query(`UPDATE "TrainingPrograms" SET "Status"='PUBLISHED',"PublishedBy"=$2,"PublishedAt"=now(),"UpdatedAt"=now() WHERE "ProgramID"=$1`,[id,actorId]);
      const after=await detail(client,id);await audit(client,actorId,'TrainingPrograms',id,p.existingId?'REPLACE_CURRICULUM':'IMPORT_CURRICULUM',before,after);
      const result={...summary,curriculumId:id,status:'PUBLISHED'};
      const batchId=await saveHistory(client,{kind:'CURRICULUM',key,hash,sourceName:p.sourceName,status:'COMPLETED',summary:result,curriculumId:id},actorId,[{raw:p,normalized:{curriculumId:id},status:'IMPORTED'}]);
      const committed={...result,batchId,replayed:false};
      if(onCommit)await onCommit(client,committed);
      return committed;
    });
  }catch(error:any){
    if(preview && error.statusCode && error.statusCode<500)return {preview:true,canCommit:false,errors:[{code:error.errorCode??'INVALID_CURRICULUM_IMPORT',message:error.message}]};
    if(!preview){try{error.importBatchId=await recordRejected(body,actorId,'CURRICULUM',error);}catch{console.error('Could not persist rejected curriculum import history.');}}
    throw error;
  }
}
