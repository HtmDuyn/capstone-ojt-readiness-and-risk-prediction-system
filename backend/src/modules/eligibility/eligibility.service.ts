import { createHash } from 'node:crypto';
import type { PoolClient } from 'pg';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, pagination, enumValue } from '../students/student.validation';
import { academicProgressWithClient } from '../students/academic-progress';
import { resultSelect } from '../students/student.service';
import { assertOfficialAssessment } from '../academic/workflow-policy';
type Row=Record<string,any>;
function stable(value:any):any {if(value instanceof Date)return value.toISOString();if(Array.isArray(value))return value.map(stable).sort((a:any,b:any)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));if(value&&typeof value==='object')return Object.fromEntries(Object.keys(value).sort().map(k=>[k,stable(value[k])]));return value;}
export const fingerprint=(value:unknown)=>createHash('sha256').update(JSON.stringify(stable(value))).digest('hex');
const ruleApi=(r:Row)=>({id:r.RuleSetID,programId:r.ProgramID,ojtSemesterId:r.OJTSemesterID,version:r.Version,name:r.Name,minCredits:Number(r.MinCredits),maxUnpassedCourses:r.MaxUnpassedCourses,debtBasis:r.DebtBasis,status:r.Status,createdBy:r.CreatedBy,createdAt:r.CreatedAt,publishedBy:r.PublishedBy,publishedAt:r.PublishedAt});
async function semester(client:PoolClient,id:number) {const r=(await client.query('SELECT * FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[id])).rows[0];if(!r)throw invalid('OJT semester not found.',404,'OJT_SEMESTER_NOT_FOUND');return r;}
export async function activeRule(client:PoolClient,programId:number|null,semesterId:number) {return (await client.query(`SELECT r.* FROM "OJTActiveRuleSets" a JOIN "OJTRuleSets" r ON r."RuleSetID"=a."RuleSetID" WHERE a."ProgramID"=$1 AND a."ScopeSemesterID" IN (0,$2) ORDER BY a."ScopeSemesterID" DESC LIMIT 1`,[programId,semesterId])).rows[0]??null;}
export async function listRules(params:Row) {
 const p=pagination(params,['programId','ojtSemesterId','status']);const args:any[]=[],where:string[]=[];
 for(const [key,col] of Object.entries({programId:'ProgramID',ojtSemesterId:'OJTSemesterID',status:'Status'}))if(params[key]!==undefined){args.push(key==='status'?enumValue(params[key],['DRAFT','PUBLISHED'],'status'):positiveId(params[key],key));where.push(`r."${col}"=$${args.length}`);}
 return academicTransaction(async c=>{const filter=where.length?'WHERE '+where.join(' AND '):'';const total=(await c.query(`SELECT count(*)::int AS n FROM "OJTRuleSets" r ${filter}`,args)).rows[0].n;const rows=(await c.query(`SELECT r.*,EXISTS(SELECT 1 FROM "OJTActiveRuleSets" a WHERE a."RuleSetID"=r."RuleSetID") AS active FROM "OJTRuleSets" r ${filter} ORDER BY r."RuleSetID" DESC LIMIT $${args.length+1} OFFSET $${args.length+2}`,[...args,p.limit,p.offset])).rows;return {items:rows.map(r=>({...ruleApi(r),active:r.active})),total,page:p.page,limit:p.limit};});
}
export async function saveRule(body:unknown,actorId:number,id?:number) {
 const b=inputObject(body,['programId','ojtSemesterId','version','name','minCredits','maxUnpassedCourses','debtBasis']);
 const fields:Row={};if('programId'in b)fields.ProgramID=positiveId(b.programId,'programId');if('ojtSemesterId'in b)fields.OJTSemesterID=b.ojtSemesterId===null?null:positiveId(b.ojtSemesterId,'ojtSemesterId');
 if('version'in b)fields.Version=positiveId(b.version,'version');if('name'in b)fields.Name=requiredText(b.name,'name',200);
 if('minCredits'in b){if(b.minCredits!==70)throw invalid('The OJT credit threshold is 70.');fields.MinCredits=b.minCredits;}
 if('maxUnpassedCourses'in b){if(b.maxUnpassedCourses!==2)throw invalid('The maximum number of unpassed courses is 2.');fields.MaxUnpassedCourses=b.maxUnpassedCourses;}
 if('debtBasis'in b)fields.DebtBasis=enumValue(b.debtBasis,['FAILED_ATTEMPTS'],'debtBasis');
 if(!id){fields.ProgramID=positiveId(b.programId,'programId');fields.Version=positiveId(b.version,'version');fields.Name=requiredText(b.name,'name',200);fields.CreatedBy=actorId;}
 return academicTransaction(async c=>{let before:Row|undefined;if(id){before=(await c.query('SELECT * FROM "OJTRuleSets" WHERE "RuleSetID"=$1 FOR UPDATE',[id])).rows[0];if(!before)throw invalid('Rule set not found.',404);if(before.Status!=='DRAFT')throw invalid('Published rules cannot be edited. Create a new version.',409,'RULE_IMMUTABLE');}
 const program=(await c.query('SELECT "ProgramID" FROM "TrainingPrograms" WHERE "ProgramID"=$1',[fields.ProgramID??before?.ProgramID])).rows[0];if(!program)throw invalid('Curriculum not found.',404);
 const sid=fields.OJTSemesterID===undefined?before?.OJTSemesterID:fields.OJTSemesterID;if(sid)await semester(c,sid);
 const keys=Object.keys(fields),values=Object.values(fields);const r=id?(await c.query(`UPDATE "OJTRuleSets" SET ${keys.map((k,i)=>`"${k}"=$${i+1}`).join(',')} WHERE "RuleSetID"=$${keys.length+1} RETURNING *`,[...values,id])).rows[0]:(await c.query(`INSERT INTO "OJTRuleSets" (${keys.map(k=>`"${k}"`).join(',')}) VALUES (${keys.map((_,i)=>`$${i+1}`).join(',')}) RETURNING *`,values)).rows[0];await audit(c,actorId,'OJTRuleSets',r.RuleSetID,id?'UPDATE':'CREATE',before,ruleApi(r));return ruleApi(r);});
}
export async function publishRule(id:number,actorId:number) {return academicTransaction(async c=>{const r=(await c.query('SELECT * FROM "OJTRuleSets" WHERE "RuleSetID"=$1 FOR UPDATE',[id])).rows[0];if(!r)throw invalid('Rule set not found.',404);
 if(r.Status==='PUBLISHED')return ruleApi(r);
 const program=(await c.query('SELECT "Status" FROM "TrainingPrograms" WHERE "ProgramID"=$1',[r.ProgramID])).rows[0];if(program.Status!=='PUBLISHED')throw invalid('Publish the curriculum before publishing OJT rules.',409,'CURRICULUM_NOT_PUBLISHED');
 const previous=(await c.query('SELECT r."Version" FROM "OJTActiveRuleSets" a JOIN "OJTRuleSets" r ON r."RuleSetID"=a."RuleSetID" WHERE a."ProgramID"=$1 AND a."ScopeSemesterID"=$2',[r.ProgramID,r.OJTSemesterID??0])).rows[0];if(previous&&previous.Version>=r.Version)throw invalid('A new active rule must have a greater version.',409,'RULE_VERSION_CONFLICT');
 const saved=(await c.query(`UPDATE "OJTRuleSets" SET "Status"='PUBLISHED',"PublishedBy"=$2,"PublishedAt"=now() WHERE "RuleSetID"=$1 RETURNING *`,[id,actorId])).rows[0];await c.query(`INSERT INTO "OJTActiveRuleSets" VALUES ($1,$2,$3) ON CONFLICT ("ProgramID","ScopeSemesterID") DO UPDATE SET "RuleSetID"=EXCLUDED."RuleSetID"`,[r.ProgramID,r.OJTSemesterID??0,id]);await audit(c,actorId,'OJTRuleSets',id,'PUBLISH',ruleApi(r),ruleApi(saved));return ruleApi(saved);});}
// The source snapshot contains academic data only; no account credentials or personal contact details.
async function inputSnapshot(c:PoolClient,studentId:number,semesterId:number,pinnedRule?:Row|null,prospectiveProgress?:Row) {
 const s=(await c.query(`SELECT s."StudentID",s."ProgramID",s."Status",u."Status" AS "AccountStatus" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" WHERE s."StudentID"=$1 FOR UPDATE OF s,u`,[studentId])).rows[0];if(!s)throw invalid('Student not found.',404,'STUDENT_NOT_FOUND');
 const term=await semester(c,semesterId);const rule=pinnedRule===undefined?await activeRule(c,s.ProgramID,semesterId):pinnedRule;
 if(rule&&(rule.ProgramID!==s.ProgramID||(rule.OJTSemesterID!==null&&rule.OJTSemesterID!==semesterId)||rule.Status!=='PUBLISHED'))throw invalid('Rule does not match the student curriculum and semester.',409,'RULE_SCOPE_CHANGED');
 const progress=prospectiveProgress??await academicProgressWithClient(c,studentId);const {computedAt,...stableProgress}=progress as Row;
 const attempts=(await c.query(`${resultSelect} WHERE r."StudentID"=$1 ORDER BY r."ResultID"`,[studentId])).rows;
 const aliases=(await c.query('SELECT "SourceCourseID","TargetCourseID" FROM "ProgramCourseEquivalences" WHERE "ProgramID"=$1 ORDER BY "SourceCourseID"',[s.ProgramID])).rows;
 const placement=(await c.query('SELECT * FROM "StudentAcademicPlacements" WHERE "StudentID"=$1',[studentId])).rows[0]??null;
 const selections=(await c.query(`SELECT sc.*,COALESCE((SELECT jsonb_agg(choice."ComboCourseID" ORDER BY choice."ComboCourseID") FROM "StudentComboCourseSelections" choice WHERE choice."SelectionID"=sc."SelectionID"),'[]'::jsonb) AS choices FROM "StudentComboSelections" sc WHERE sc."StudentID"=$1 ORDER BY sc."SelectionID"`,[studentId])).rows;
 return {student:s,semester:term,rule,progress:stableProgress,attempts,aliases,placement,selections};
}
export function evaluateEligibility(input:Row) {
 const {student,rule,progress,attempts,aliases}=input;const reasons:string[]=[];
 const mapping=new Map<number,number>(aliases.map((a:Row)=>[a.SourceCourseID,a.TargetCourseID]));
 const canonical=(id:number)=>{const seen=new Set<number>();while(mapping.has(id)){if(seen.has(id))return -1;seen.add(id);id=mapping.get(id)!;}return id;};
 const scoped=new Set<number>(progress.requirements.flatMap((r:Row)=>r.choices));const groups=new Map<number,Row[]>();
 for(const r of attempts){const key=canonical(r.courseId);if(scoped.has(key))groups.set(key,[...(groups.get(key)??[]),r]);}
 const unpassedCourses=[...groups].filter(([,rows])=>rows.some(r=>r.status==='FAILED')&&!rows.some(r=>['PASSED','RECOGNIZED'].includes(r.status))).map(([id,rows])=>({courseId:id,courseCode:rows.find(r=>r.courseId===id)?.courseCode??rows[0].courseCode,resultIds:rows.map(r=>r.id)})).sort((a,b)=>a.courseId-b.courseId);
 if(!rule)reasons.push('OJT_RULE_NOT_PUBLISHED');
 if(!progress.credits.completeConfiguration)reasons.push('ACADEMIC_CREDIT_DATA_INCOMPLETE');
 if(student.Status!=='ACTIVE'||student.AccountStatus!=='ACTIVE')reasons.push('STUDENT_NOT_ACTIVE');
 const missingCredits=rule?Math.max(0,Math.round((Number(rule.MinCredits)-progress.credits.earned)*100)/100):null;
 let status='REVIEW_REQUIRED';if(!reasons.length){if(missingCredits!>0)reasons.push('MIN_CREDITS_NOT_MET');if(unpassedCourses.length>rule.MaxUnpassedCourses)reasons.push('MAX_UNPASSED_COURSES_EXCEEDED');status=reasons.length?'NOT_ELIGIBLE':'ELIGIBLE';}
 return {studentId:student.StudentID,ojtSemesterId:input.semester.OJTSemesterID,status,ruleSetId:rule?.RuleSetID??null,rule:rule?ruleApi(rule):null,earnedCredits:progress.credits.earned,missingCredits,unpassedCourseCount:unpassedCourses.length,unpassedCourses,excessUnpassedCourses:rule?Math.max(0,unpassedCourses.length-rule.MaxUnpassedCourses):null,reasons,academicIssues:progress.credits.completeConfiguration?[]:progress.issues};
}
export async function prospectiveEligibility(c:PoolClient,studentId:number,semesterId:number,progress:Row) {return evaluateEligibility(await inputSnapshot(c,studentId,semesterId,undefined,progress));}
export async function performEligibilityCheck(c:PoolClient,studentId:number,semesterId:number,actorId:number,source='MANUAL',runId:number|null=null,eventId:number|null=null,pinnedRule?:Row|null) {
 const input=await inputSnapshot(c,studentId,semesterId,pinnedRule),result=evaluateEligibility(input),hash=fingerprint(input);
 const row=(await c.query(`INSERT INTO "EligibilityChecks" ("StudentID","OJTSemesterID","RuleSetID","RunID","ComboEventID","Source","Status","SourceHash","InputSnapshot","Result","CheckedBy") VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING "CheckID","CheckedAt"`,[studentId,semesterId,result.ruleSetId,runId,eventId,source,result.status,hash,JSON.stringify(input),JSON.stringify(result),actorId])).rows[0];
 await c.query(`INSERT INTO "StudentOJTEligibility" ("StudentID","OJTSemesterID","Status","CheckedDate","CheckedBy","MissingCredits","MissingCoursesNote","Details") VALUES ($1,$2,$3,now(),$4,$5,$6,$7) ON CONFLICT ("StudentID","OJTSemesterID") DO UPDATE SET "Status"=EXCLUDED."Status","CheckedDate"=now(),"CheckedBy"=EXCLUDED."CheckedBy","MissingCredits"=EXCLUDED."MissingCredits","MissingCoursesNote"=EXCLUDED."MissingCoursesNote","Details"=EXCLUDED."Details"`,[studentId,semesterId,result.status,actorId,result.missingCredits,result.unpassedCourses.map(r=>r.courseCode).join(',').slice(0,1000),JSON.stringify({...result,checkId:row.CheckID})]);
 return {checkId:row.CheckID,checkedAt:row.CheckedAt,...result};
}
export async function checkStudent(id:number,body:unknown,actor:number) {const b=inputObject(body,['ojtSemesterId']);return academicTransaction(c=>performEligibilityCheck(c,id,positiveId(b.ojtSemesterId,'ojtSemesterId'),actor));}
const checkApi=(r:Row)=>({checkId:r.CheckID,source:r.Source,runId:r.RunID,checkedBy:r.CheckedBy,checkedAt:r.CheckedAt,...r.Result,confirmation:r.ConfirmedAt?{confirmedBy:r.ConfirmedBy,confirmedAt:r.ConfirmedAt,reason:r.Reason,assessment:r.AssessmentSnapshot}:null});
const checkSelect=`SELECT e.*,f."ConfirmedBy",f."ConfirmedAt",f."Reason",f."AssessmentSnapshot" FROM "EligibilityChecks" e LEFT JOIN "EligibilityConfirmations" f ON f."CheckID"=e."CheckID"`;
export async function history(id:number,params:Row) {const p=pagination(params,['ojtSemesterId']);const sid=params.ojtSemesterId===undefined?null:positiveId(params.ojtSemesterId,'ojtSemesterId');return academicTransaction(async c=>{if(!(await c.query('SELECT 1 FROM "Students" WHERE "StudentID"=$1',[id])).rowCount)throw invalid('Student not found.',404);const where='WHERE e."StudentID"=$1 AND ($2::int IS NULL OR e."OJTSemesterID"=$2)';const total=(await c.query(`SELECT count(*)::int AS n FROM "EligibilityChecks" e ${where}`,[id,sid])).rows[0].n;const rows=(await c.query(`${checkSelect} ${where} ORDER BY e."CheckID" DESC LIMIT $3 OFFSET $4`,[id,sid,p.limit,p.offset])).rows;return {items:rows.map(checkApi),total,page:p.page,limit:p.limit};});}
export async function eligibility(id:number,params:Row) {for(const key of Object.keys(params))if(key!=='ojtSemesterId')throw invalid(`Unknown query parameter: ${key}.`);const sid=positiveId(params.ojtSemesterId,'ojtSemesterId');return academicTransaction(async c=>{const input=await inputSnapshot(c,id,sid),hash=fingerprint(input);const latest=(await c.query(`${checkSelect} WHERE e."StudentID"=$1 AND e."OJTSemesterID"=$2 ORDER BY e."CheckID" DESC LIMIT 1`,[id,sid])).rows[0];const official=(await c.query(`${checkSelect} WHERE e."StudentID"=$1 AND e."OJTSemesterID"=$2 AND f."CheckID" IS NOT NULL ORDER BY f."ConfirmedAt" DESC,e."CheckID" DESC LIMIT 1`,[id,sid])).rows[0];return {studentId:id,ojtSemesterId:sid,current:evaluateEligibility(input),latest:latest?{...checkApi(latest),isStale:latest.SourceHash!==hash}:null,official:official?{...checkApi(official),isStale:official.SourceHash!==hash}:null};});}
export async function confirm(id:number,body:unknown,actor:number) {const b=inputObject(body,['reason']);const reason=requiredText(b.reason,'reason',1000);return academicTransaction(async c=>{const r=(await c.query(`${checkSelect} WHERE e."CheckID"=$1`,[id])).rows[0];if(!r)throw invalid('Eligibility check not found.',404);if(r.Status==='REVIEW_REQUIRED')throw invalid('Resolve missing configuration before official confirmation.',409,'ELIGIBILITY_REVIEW_REQUIRED');const input=await inputSnapshot(c,r.StudentID,r.OJTSemesterID);if(fingerprint(input)!==r.SourceHash)throw invalid('Academic data or active rules changed. Run a new check.',409,'ELIGIBILITY_CHECK_STALE');if(r.ConfirmedAt){if(r.ConfirmedBy===actor&&r.Reason===reason)return checkApi(r);throw invalid('This check has already been confirmed.',409,'ELIGIBILITY_ALREADY_CONFIRMED');}
 const assessment=await assertOfficialAssessment(c,r);
 const newer=(await c.query(`SELECT 1 FROM "EligibilityChecks" e JOIN "EligibilityConfirmations" f ON f."CheckID"=e."CheckID" WHERE e."StudentID"=$1 AND e."OJTSemesterID"=$2 AND e."CheckID">$3`,[r.StudentID,r.OJTSemesterID,id])).rowCount;if(newer)throw invalid('A newer check is already official.',409,'NEWER_OFFICIAL_CHECK');
 await c.query('INSERT INTO "EligibilityConfirmations" ("CheckID","ConfirmedBy","Reason","AssessmentSnapshot") VALUES ($1,$2,$3,$4)',[id,actor,reason,JSON.stringify(assessment)]);await audit(c,actor,'EligibilityChecks',id,'CONFIRM',null,{status:r.Status,reason});return checkApi((await c.query(`${checkSelect} WHERE e."CheckID"=$1`,[id])).rows[0]);});}

// Share the same current-source comparison with registration approval and handoff transactions.
export async function officialEligibilityWithClient(c:PoolClient,studentId:number,semesterId:number) {
 const row=(await c.query(`${checkSelect} WHERE e."StudentID"=$1 AND e."OJTSemesterID"=$2 AND f."CheckID" IS NOT NULL ORDER BY f."ConfirmedAt" DESC,e."CheckID" DESC LIMIT 1`,[studentId,semesterId])).rows[0];
 if(!row)return null;
 const input=await inputSnapshot(c,studentId,semesterId);
 return {...checkApi(row),isStale:row.SourceHash!==fingerprint(input),programId:input.student.ProgramID};
}
