import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { pagination } from '../students/student.validation';
import { assertStudentAccess, student } from '../students/student.service';
import { combos } from '../curriculum/curriculum.repository';
import { validateComboCapacity } from '../curriculum/curriculum.structure';
import { invalid, inputObject, positiveId, requiredText, ids, purpose } from './combo.validation';
import { roster, windowRecord, activeChoice, cancelQueuedReminders, type Row } from './combo.repository';
import { now } from './window.service';
import { recalculateAcademicState } from './combo-eligibility';
import { academicProgressWithClient } from '../students/academic-progress';
import { prospectiveEligibility } from '../eligibility/eligibility.service';

export async function assertRosterContext(client:PoolClient,r:Row) {
  const current=(await client.query(`SELECT s."ProgramID",s."Status",u."Status" AS "AccountStatus",p."CohortID",p."GroupCode",p."EntryAcademicPeriodID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" JOIN "StudentAcademicPlacements" p ON p."StudentID"=s."StudentID" WHERE s."StudentID"=$1`,[r.studentId])).rows[0];
  if(!current || current.Status!=='ACTIVE' || current.AccountStatus!=='ACTIVE' || current.ProgramID!==r.programId || current.CohortID!==r.scopeSnapshot.cohortId || current.GroupCode!==r.scopeSnapshot.groupCode || current.EntryAcademicPeriodID!==r.scopeSnapshot.entryAcademicPeriodId)throw invalid(`Student ${r.studentId}'s academic placement/account changed after scope was frozen. Review the roster.`,409,'COMBO_ROSTER_CHANGED');
  const relative=(await client.query(`SELECT count(*)::int AS n FROM "AcademicPeriods" sem JOIN "AcademicPeriods" entry ON entry."AcademicPeriodID"=$1 JOIN "AcademicPeriods" target ON target."AcademicPeriodID"=$2 LEFT JOIN "AcademicPeriods" parent ON parent."AcademicPeriodID"=target."ParentPeriodID" WHERE sem."Kind"='SEMESTER' AND sem."StartDate">=entry."StartDate" AND sem."StartDate"<=COALESCE(parent."StartDate",target."StartDate")`,[current.EntryAcademicPeriodID,r.scopeSnapshot.academicPeriodId])).rows[0].n;
  if(relative!==4)throw invalid('Academic calendar changed and this roster no longer targets specialized semester 4.',409,'COMBO_ROSTER_CHANGED');
}
export async function validateChoice(client:PoolClient,programId:number,comboId:number,courseIds:number[]) {
  const combo=(await client.query(`SELECT b.*,p."Status" AS "ProgramStatus",p."ProgramCode",p."Version" FROM "ProgramCombos" b JOIN "TrainingPrograms" p ON p."ProgramID"=b."ProgramID" WHERE b."ProgramComboID"=$1 AND b."ProgramID"=$2`,[comboId,programId])).rows[0];
  if(!combo || combo.ProgramStatus!=='PUBLISHED' || purpose(combo)!=='SPECIALIZATION')throw invalid('Choose a specialization combo in this student’s published curriculum.');
  const value=(await combos(client,programId)).find(c=>c.id===comboId)!;
  if(!value.coursesReviewed || !value.choiceGroups.length)throw invalid('Combo choices have not been reviewed.');
  if(courseIds.some(id=>!value.courses.some((c:Row)=>c.courseId===id)))throw invalid('Selected courses must belong to the chosen combo.');
  for(const group of value.choiceGroups){const count=group.courseIds.filter((id:number)=>courseIds.includes(id)).length;if(count<group.minCourses||count>group.maxCourses)throw invalid(`Choice group ${group.code} requires ${group.minCourses}–${group.maxCourses} courses.`);}
  const chosen=value.courses.filter((c:Row)=>courseIds.includes(c.courseId));
  validateComboCapacity({courses:chosen,choiceGroups:value.choiceGroups.map((g:Row)=>({courseIds:g.courseIds.filter((id:number)=>courseIds.includes(id)),maxCourses:g.courseIds.filter((id:number)=>courseIds.includes(id)).length}))});
  const aliases=(await client.query('SELECT "SourceCourseID","TargetCourseID" FROM "ProgramCourseEquivalences" WHERE "ProgramID"=$1',[programId])).rows;
  const mapping=new Map<number,number>(aliases.map(a=>[a.SourceCourseID,a.TargetCourseID]));
  const canonical=(id:number)=>{const seen=new Set<number>();while(mapping.has(id)){if(seen.has(id))throw invalid('Curriculum equivalence cycle.');seen.add(id);id=mapping.get(id)!;}return id;};
  if(new Set(courseIds.map(canonical)).size!==courseIds.length)throw invalid('Equivalent courses cannot be selected as two distinct combo requirements.');
  return {programId,programCode:combo.ProgramCode,version:combo.Version,comboId,code:combo.ComboCode,name:combo.ComboName,courseIds,courses:chosen};
}
async function impact(client:PoolClient,studentId:number,semesterId:number,comboId:number,courseIds:number[]) {
  const current=await academicProgressWithClient(client,studentId),proposed=await academicProgressWithClient(client,studentId,{comboId,courseIds});
  return {isPreview:true,current,proposed,eligibility:await prospectiveEligibility(client,studentId,semesterId,proposed),missingRequiredCourses:proposed.requirements.filter((r:any)=>r.required&&!r.completed),earnedCreditDelta:proposed.credits.earned-current.credits.earned};
}
export async function submitChoice(windowId:number,body:unknown,user:{userId:number;roleCode:string},previewOnly=false) {
  const b=inputObject(body,['studentId','comboId','courseIds','reason']),comboId=positiveId(b.comboId,'comboId'),courseIds=ids(b.courseIds,'courseIds',500);
  return academicTransaction(async client=>{
    const w=await windowRecord(client,windowId,true);if(w.Status!=='OPEN')throw invalid('This window is not open.',409,'COMBO_WINDOW_CLOSED');
    let studentId:number;
    if(user.roleCode==='STUDENT') {
      const own=(await client.query('SELECT "StudentID" FROM "Students" WHERE "UserID"=$1',[user.userId])).rows[0];if(!own)throw invalid('Student profile not found.',404);
      studentId=own.StudentID;if(b.studentId!==undefined && positiveId(b.studentId,'studentId')!==studentId)throw invalid('You can submit only your own choice.',403,'FORBIDDEN');
    }else studentId=positiveId(b.studentId,'studentId');
    const member=(await roster(client,windowId)).find(r=>r.studentId===studentId);if(!member)throw invalid('Student is outside this window’s scope.',403,'OUTSIDE_COMBO_SCOPE');
    await assertRosterContext(client,member);
    const choice=await validateChoice(client,member.programId,comboId,courseIds),active=await activeChoice(client,studentId,member.programId);
    const previous=member.choiceSnapshot??active[0]??null;
    const changed=previous && (previous.comboId!==comboId || JSON.stringify(previous.courseIds)!==JSON.stringify(courseIds));
    const reason=previewOnly?null:(changed || user.roleCode!=='STUDENT')?requiredText(b.reason,'reason',2000):b.reason===undefined?null:requiredText(b.reason,'reason',2000);
    const time=await now(client);if(time<new Date(w.StartsAt)||time>=new Date(member.effectiveEndsAt))throw invalid('Outside your effective registration deadline.',409,'COMBO_DEADLINE');
    const preview=await impact(client,studentId,w.OJTSemesterID,comboId,courseIds);
    if(previewOnly)return {windowId,studentId,phase:w.Phase,choice,preview,effectiveEndsAt:member.effectiveEndsAt};
    const event=(await client.query(`INSERT INTO "StudentComboSelectionEvents" ("WindowID","StudentID","ProgramComboID","EventType","CourseIDs","ChoiceSnapshot","PreviousSnapshot","CreatedBy","Reason","SourceEventID") VALUES ($1,$2,$3,'SUBMITTED',$4,$5,$6,$7,$8,$9) RETURNING "EventID","CreatedAt"`,[windowId,studentId,comboId,JSON.stringify(courseIds),JSON.stringify(choice),previous?JSON.stringify(previous):null,user.userId,reason,member.eventId??null])).rows[0];
    await cancelQueuedReminders(client,windowId,studentId);
    await audit(client,user.userId,'StudentComboSelectionEvents',event.EventID,'SUBMIT_COMBO_CHOICE',previous,choice,reason??undefined);
    return {eventId:event.EventID,windowId,studentId,phase:w.Phase,choice,preview,submittedAt:event.CreatedAt,effectiveEndsAt:member.effectiveEndsAt,status:'SUBMITTED'};
  });
}
export async function finalizeWindow(id:number,body:unknown,actorId:number) {
  const b=inputObject(body,['reason','idempotencyKey','allowUnselected','excludeStudentIds']);
  const reason=requiredText(b.reason,'reason',2000),key=requiredText(b.idempotencyKey,'idempotencyKey',100);
  if(b.allowUnselected!==undefined && typeof b.allowUnselected!=='boolean')throw invalid('allowUnselected must be boolean.');
  const excluded=b.excludeStudentIds===undefined?[]:ids(b.excludeStudentIds,'excludeStudentIds');
  const hash=createHash('sha256').update(JSON.stringify({reason,allowUnselected:b.allowUnselected??false,excluded})).digest('hex');
  return academicTransaction(async client=>{
    const w=await windowRecord(client,id,true);
    if(w.Status==='FINALIZED') {
      if(w.FinalizeKey!==key||w.FinalizeHash!==hash||w.FinalizedBy!==actorId)throw invalid('Window already finalized by another request.',409,'FINALIZE_CONFLICT');
      return {...w.FinalizeSummary,replayed:true};
    }
    if(w.Status!=='CLOSED')throw invalid('Close the window before finalizing.',409,'WINDOW_NOT_CLOSED');
    const rows=await roster(client,id);if(!rows.length)throw invalid('Window has no frozen roster.');
    if(excluded.some(id=>!rows.some(r=>r.studentId===id)))throw invalid('Excluded students must belong to the frozen roster.');
    const missing=rows.filter(r=>!r.eventId&&!excluded.includes(r.studentId)).map(r=>r.studentId);
    if(missing.length&&!b.allowUnselected)throw invalid(`Students still missing a choice: ${missing.join(',')}. Extend/reopen or explicitly allowUnselected with a reason.`,409,'COMBO_CHOICES_MISSING');
    const applied:Row[]=[];
    for(const r of rows) {
      const before=await activeChoice(client,r.studentId,r.programId);
      if(!r.eventId||excluded.includes(r.studentId)) {
        await client.query(`INSERT INTO "StudentComboSelectionEvents" ("WindowID","StudentID","EventType","CourseIDs","ChoiceSnapshot","PreviousSnapshot","CreatedBy","Reason","SourceEventID") VALUES ($1,$2,'UNSELECTED','[]',$3,$4,$5,$6,$7)`,[id,r.studentId,JSON.stringify({phase:w.Phase,outcome:'UNSELECTED',excluded:excluded.includes(r.studentId)}),JSON.stringify(before),actorId,reason,r.eventId??null]);
        await client.query(`UPDATE "ComboWindowStudents" SET "Outcome"='UNSELECTED',"FinalizedAt"=now() WHERE "WindowID"=$1 AND "StudentID"=$2`,[id,r.studentId]);continue;
      }
      await assertRosterContext(client,r);
      const choice=await validateChoice(client,r.programId,r.comboId,r.courseIds);
      await client.query(`DELETE FROM "StudentComboCourseSelections" WHERE "SelectionID" IN (SELECT "SelectionID" FROM "StudentComboSelections" WHERE "StudentID"=$1 AND "ProgramID"=$2 AND "SelectionPurpose"='SPECIALIZATION')`,[r.studentId,r.programId]);
      await client.query(`DELETE FROM "StudentComboSelections" WHERE "StudentID"=$1 AND "ProgramID"=$2 AND "SelectionPurpose"='SPECIALIZATION'`,[r.studentId,r.programId]);
      const selection=(await client.query(`INSERT INTO "StudentComboSelections" ("StudentID","ProgramID","ProgramComboID","SelectedAt","ConfirmedAt","ConfirmedBy") VALUES ($1,$2,$3,$4,now(),$5) RETURNING "SelectionID"`,[r.studentId,r.programId,r.comboId,r.submittedAt,actorId])).rows[0].SelectionID;
      for(const course of choice.courses)await client.query(`INSERT INTO "StudentComboCourseSelections" ("SelectionID","ProgramComboID","ComboCourseID") VALUES ($1,$2,$3)`,[selection,r.comboId,course.id]);
      const eventId=(await client.query(`INSERT INTO "StudentComboSelectionEvents" ("WindowID","StudentID","ProgramComboID","EventType","CourseIDs","ChoiceSnapshot","PreviousSnapshot","CreatedBy","Reason","SourceEventID") VALUES ($1,$2,$3,'APPLIED',$4,$5,$6,$7,$8,$9) RETURNING "EventID"`,[id,r.studentId,r.comboId,JSON.stringify(r.courseIds),JSON.stringify(choice),JSON.stringify(before),actorId,reason,r.eventId])).rows[0].EventID;
      const recalculated=await recalculateAcademicState(client,r.studentId,w.OJTSemesterID,actorId,eventId);
      await client.query(`UPDATE "ComboWindowStudents" SET "Outcome"='APPLIED',"FinalizedAt"=now() WHERE "WindowID"=$1 AND "StudentID"=$2`,[id,r.studentId]);
      await audit(client,actorId,'StudentComboSelections',selection,'APPLY_COMBO_CHOICE',before,choice,reason);
      applied.push({studentId:r.studentId,eventId,recalculationId:recalculated.recalculationId,progressStatus:recalculated.progress.status,eligibilityStatus:recalculated.eligibility.status});
    }
    const summary={windowId:id,phase:w.Phase,applied:applied.length,unselected:missing.length+excluded.length,excludedStudentIds:excluded,results:applied};
    await client.query(`UPDATE "ComboRegistrationWindows" SET "Status"='FINALIZED',"FinalizedAt"=now(),"FinalizedBy"=$2,"FinalizeKey"=$3,"FinalizeHash"=$4,"FinalizeSummary"=$5,"UpdatedAt"=now() WHERE "WindowID"=$1`,[id,actorId,key,hash,JSON.stringify(summary)]);
    await audit(client,actorId,'ComboRegistrationWindows',id,'FINALIZE_COMBO_WINDOW',w,summary,reason);return {...summary,replayed:false};
  });
}
export async function studentComboHistory(studentId:number,params:Record<string,unknown>,user:{userId:number;roleCode:string}) {
  await assertStudentAccess(studentId,user);await student(studentId);const p=pagination(params,[]);
  return academicTransaction(async client=>{
    const current=(await client.query('SELECT "ProgramID" FROM "Students" WHERE "StudentID"=$1',[studentId])).rows[0];
    const count=(await client.query('SELECT count(*)::int AS n FROM "StudentComboSelectionEvents" WHERE "StudentID"=$1',[studentId])).rows[0].n;
    const events=(await client.query(`SELECT e."EventID" AS id,e."WindowID" AS "windowId",w."Phase" AS phase,w."InitialWindowID" AS "initialWindowId",e."EventType" AS type,e."ChoiceSnapshot" AS choice,e."PreviousSnapshot" AS previous,e."CreatedBy" AS "createdBy",e."CreatedAt" AS "createdAt",e."Reason" AS reason,e."SourceEventID" AS "sourceEventId",r."Progress" AS progress,r."Eligibility" AS eligibility FROM "StudentComboSelectionEvents" e JOIN "ComboRegistrationWindows" w ON w."WindowID"=e."WindowID" LEFT JOIN "StudentAcademicRecalculations" r ON r."EventID"=e."EventID" WHERE e."StudentID"=$1 ORDER BY e."EventID" DESC LIMIT $2 OFFSET $3`,[studentId,p.limit,p.offset])).rows;
    return {studentId,current:await activeChoice(client,studentId,current.ProgramID),items:events,total:count,page:p.page,limit:p.limit};
  });
}
