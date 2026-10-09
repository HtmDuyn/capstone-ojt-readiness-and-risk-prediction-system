import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { recordRejected, saveHistory } from '../students/academic-import.service';
import { array, inputObject, requiredText, optionalText, metadata, unique, invalid } from './curriculum.validation';
import { normalizeCourses, normalizeCombo, normalizePrerequisites, normalizeEquivalences, writeCourses, writeComboCourses, writePrerequisites, writeEquivalences, type Row } from './curriculum.structure';
import { comboMetadata, insertCombo, writeMetadata } from './curriculum.service';
import { detail } from './curriculum.repository';

async function prepare(client:PoolClient,body:unknown) {
  const b=inputObject(body,['idempotencyKey','sourceName','curriculum','courses','prerequisites','combos','equivalences']);
  const key=requiredText(b.idempotencyKey,'idempotencyKey',100),sourceName=optionalText(b.sourceName,'sourceName',150),meta=metadata(b.curriculum);
  if(!(await client.query('SELECT 1 FROM "Specializations" WHERE "SpecializationID"=$1',[meta.fields.SpecializationID])).rowCount)throw invalid('Unknown curriculum majorId.');
  if((await client.query(`SELECT 1 FROM "TrainingPrograms" WHERE upper("ProgramCode")=upper($1) AND COALESCE(upper("Version"),'')=upper($2)`,[meta.fields.ProgramCode,meta.fields.Version])).rowCount)throw invalid('Curriculum code/version already exists. Import a new version.',409,'CURRICULUM_DUPLICATE');
  const courses=await normalizeCourses(client,b.courses),combos:Row[]=[];
  for(const raw of array(b.combos,'combos',100)) {
    const c=inputObject(raw,['code','name','selectionGroup','note','courses','choiceGroups']);
    const m=comboMetadata({code:c.code,name:c.name,selectionGroup:c.selectionGroup,note:c.note});
    combos.push({...m,...await normalizeCombo(client,{courses:c.courses,choiceGroups:c.choiceGroups},courses)});
  }
  unique(combos.map(c=>c.code),'combo code');
  const comboCourses=combos.flatMap(c=>c.courses),prerequisites=normalizePrerequisites(b.prerequisites,courses,comboCourses),equivalences=await normalizeEquivalences(client,b.equivalences,courses,comboCourses);
  return {key,sourceName,curriculum:b.curriculum,courses,combos,prerequisites,equivalences};
}
export async function importCurriculum(body:unknown,actorId:number,preview:boolean) {
  try {
    const b=inputObject(body,['idempotencyKey','sourceName','curriculum','courses','prerequisites','combos','equivalences']);
    const key=requiredText(b.idempotencyKey,'idempotencyKey',100),hash=createHash('sha256').update(JSON.stringify({sourceName:b.sourceName??null,curriculum:b.curriculum,courses:b.courses,prerequisites:b.prerequisites,combos:b.combos,equivalences:b.equivalences})).digest('hex');
    return await academicTransaction(async client=>{
      if(!preview){const old=(await client.query(`SELECT * FROM "AcademicImportBatches" WHERE "Kind"='CURRICULUM' AND "Status"='COMPLETED' AND "IdempotencyKey"=$1`,[key])).rows[0];if(old){if(old.PayloadHash!==hash||old.ImportedBy!==actorId)throw invalid('Idempotency key belongs to another payload or actor.',409,'IMPORT_CONFLICT');return {...old.Summary,batchId:old.BatchID,replayed:true};}}
      const p=await prepare(client,body);
      const summary={courseCount:p.courses.length,comboCount:p.combos.length,prerequisiteGroupCount:p.prerequisites.length,equivalenceCount:p.equivalences.length,canCommit:true};
      if(preview)return {...summary,preview:true,normalized:p};
      const id=await writeMetadata(client,p.curriculum,actorId);await writeCourses(client,id,p.courses);
      for(const c of p.combos){const comboId=await insertCombo(client,id,c);await writeComboCourses(client,id,comboId,c);}
      await writePrerequisites(client,id,p.prerequisites);await writeEquivalences(client,id,p.equivalences,actorId);
      const after=await detail(client,id);await audit(client,actorId,'TrainingPrograms',id,'IMPORT_CURRICULUM',null,after);
      const result={...summary,curriculumId:id,status:'DRAFT'};
      const batchId=await saveHistory(client,{kind:'CURRICULUM',key,hash,sourceName:p.sourceName,status:'COMPLETED',summary:result,curriculumId:id},actorId,[{raw:p,normalized:{curriculumId:id},status:'IMPORTED'}]);
      return {...result,batchId,replayed:false};
    });
  }catch(error:any){
    if(preview && error.statusCode && error.statusCode<500)return {preview:true,canCommit:false,errors:[{code:error.errorCode??'INVALID_CURRICULUM_IMPORT',message:error.message}]};
    if(!preview){try{error.importBatchId=await recordRejected(body,actorId,'CURRICULUM',error);}catch{console.error('Could not persist rejected curriculum import history.');}}
    throw error;
  }
}
