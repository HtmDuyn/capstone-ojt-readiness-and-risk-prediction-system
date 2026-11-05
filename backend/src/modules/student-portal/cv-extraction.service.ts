import { randomUUID } from 'node:crypto';
import type { PoolClient } from 'pg';
import { academicTransaction,audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { academicProgressWithClient } from '../students/academic-progress';
import { currentCV } from '../students/cv.service';
import { inputObject,invalid,positiveId } from '../students/student.validation';
import { ownStudent,type Actor,type Row } from './shared';
import { CV_SCHEMA_VERSION,validateCvProfile } from './cv-profile.schema';
import { cvProviderConfig,CvProviderError,extractCvWithClaude } from './claude-cv';

async function migrationGuard<T>(work:()=>Promise<T>) {
 try{return await work();}catch(e:any){if(e.code==='42P01')throw invalid('Cần chạy migration CV extraction trước khi dùng tính năng này.',503,'CV_MIGRATION_REQUIRED');throw e;}
}
function analysisApi(r:Row|null) {
 if(!r)return null;
 return {id:r.AnalysisID,cvFileId:r.CVFileID,status:r.Status,revision:r.Revision,schemaVersion:r.SchemaVersion,
  modelVersion:r.Model,profile:r.Profile,extractedProfile:r.ExtractedProfile,confirmedAt:r.ConfirmedAt,
  updatedAt:r.UpdatedAt,error:r.Failure,evidenceVerified:false,
  confirmationRequired:r.Status!=='CONFIRMED',canRetry:r.Status==='FAILED'||(r.Status==='PROCESSING'&&Date.now()-new Date(r.StartedAt).getTime()>120000)};
}
async function lockStudent(c:PoolClient,actor:Actor) {
 const student=await ownStudent(c,actor);
 await c.query('SELECT "StudentID" FROM "Students" WHERE "StudentID"=$1 FOR UPDATE',[student.StudentID]);
 return student;
}

export async function matchingProfile(actor:Actor) {
 return migrationGuard(()=>readTransaction(async c=>{
  const student=await ownStudent(c,actor),cv=await currentCV(c,student.StudentID);
  const r=cv?(await c.query('SELECT * FROM "StudentCVExtractions" WHERE "StudentID"=$1 AND "CVFileID"=$2 AND "SchemaVersion"=$3 AND ($4::text IS NULL OR "Model"=$4) ORDER BY "AnalysisID" DESC LIMIT 1',[student.StudentID,cv.id,CV_SCHEMA_VERSION,process.env.CLAUDE_CV_MODEL?.trim()||null])).rows[0]??null:null;
  const academic=await academicProgressWithClient(c,student.StudentID);
  const program=(await c.query('SELECT t."ProgramCode",s."SpecializationName" FROM "TrainingPrograms" t LEFT JOIN "Specializations" s ON s."SpecializationID"=t."SpecializationID" WHERE t."ProgramID"=$1',[student.ProgramID])).rows[0];
  const officialAcademic={programCode:program?.ProgramCode??null,major:program?.SpecializationName??null,gpa:academic.gpa,gpaScale:academic.gpaScale};
  const discrepancies:string[]=[];
  for(const e of r?.Profile?.education??[]){
   if(e.gpa!==null&&e.gpaScale===academic.gpaScale&&academic.gpa!==null&&Math.abs(e.gpa-academic.gpa)>0.01)discrepancies.push('CV_GPA_DIFFERS_FROM_ACADEMIC_RECORD');
   if(e.gpa!==null&&academic.gpaScale!==null&&e.gpaScale!==academic.gpaScale)discrepancies.push('CV_GPA_SCALE_REQUIRES_REVIEW');
   if(e.major&&officialAcademic.major&&e.major.trim().toLowerCase()!==officialAcademic.major.trim().toLowerCase())discrepancies.push('CV_MAJOR_REQUIRES_REVIEW');
  }
  return {cv,status:!cv?'NO_CV':r?.Status??'NOT_ANALYZED',analysis:analysisApi(r),officialAcademic,
   discrepancies:[...new Set(discrepancies)],usableForMatching:r?.Status==='CONFIRMED',
   message:'Thông tin trích xuất cần sinh viên kiểm tra. Đoạn trích/số trang là căn cứ do model cung cấp, chưa được đối chiếu tự động. Ngành và GPA chính thức luôn lấy từ dữ liệu nhà trường.'};
 }));
}

export async function analyzeCurrentCv(body:unknown,actor:Actor) {
 const b=inputObject(body,['cvFileId','consent']);const cvFileId=positiveId(b.cvFileId,'cvFileId');
 if(b.consent!==true)throw invalid('Cần đồng ý gửi nội dung file CV đến Claude để trích xuất.',400,'CV_CONSENT_REQUIRED');
 let config;try{config=cvProviderConfig();}catch(e){if(e instanceof CvProviderError)throw invalid(e.message,503,e.code);throw e;}
 const prepared=await migrationGuard(()=>academicTransaction(async c=>{
  const student=await lockStudent(c,actor),cv=await currentCV(c,student.StudentID);
  if(!cv||cv.id!==cvFileId)throw invalid('Hãy phân tích phiên bản CV hiện tại của chính bạn.',409,'CV_VERSION_CHANGED');
  const old=(await c.query('SELECT * FROM "StudentCVExtractions" WHERE "CVFileID"=$1 AND "SchemaVersion"=$2 AND "Model"=$3 FOR UPDATE',[cvFileId,CV_SCHEMA_VERSION,config.model])).rows[0];
  if(old&&(['NEEDS_REVIEW','CONFIRMED'].includes(old.Status)||(old.Status==='PROCESSING'&&Date.now()-new Date(old.StartedAt).getTime()<120000)))return {cached:old,file:null,token:null,studentId:student.StudentID};
  const token=randomUUID();
  const record=(await c.query(`INSERT INTO "StudentCVExtractions" ("StudentID","CVFileID","FileHash","SchemaVersion","Model","Status","RequestToken")
   VALUES ($1,$2,$3,$4,$5,'PROCESSING',$6) ON CONFLICT ("CVFileID","SchemaVersion","Model") DO UPDATE
   SET "Status"='PROCESSING',"RequestToken"=EXCLUDED."RequestToken","StartedAt"=now(),"UpdatedAt"=now(),"ConsentAt"=now(),
    "Revision"="StudentCVExtractions"."Revision"+1,"Failure"=NULL,"ConfirmedAt"=NULL,"Profile"=NULL,"ExtractedProfile"=NULL RETURNING *`,
   [student.StudentID,cvFileId,cv.sha256,CV_SCHEMA_VERSION,config.model,token])).rows[0];
  const file=(await c.query('SELECT "Content" FROM "StudentCVFiles" WHERE "CVFileID"=$1 AND "StudentID"=$2',[cvFileId,student.StudentID])).rows[0].Content as Buffer;
  return {cached:null,record,file,token,studentId:student.StudentID};
 }));
 if(prepared.cached)return {analysis:analysisApi(prepared.cached),replayed:true};
 let profile:ReturnType<typeof validateCvProfile>|null=null,failure:{code:string;message:string}|null=null;
 try{profile=await extractCvWithClaude(prepared.file!,config);}catch(e){failure=e instanceof CvProviderError?{code:e.code,message:e.message}:{code:'CV_PROVIDER_FAILED',message:'Không đọc được CV; có thể thử lại sau.'};}
 // The provider request runs outside the database transaction.
 return migrationGuard(()=>academicTransaction(async c=>{
  await lockStudent(c,actor);const cv=await currentCV(c,prepared.studentId);
  if(cv?.id!==cvFileId){profile=null;failure={code:'CV_VERSION_CHANGED',message:'CV đã thay đổi trong lúc phân tích; hãy phân tích file mới.'};}
  const r=(await c.query(`UPDATE "StudentCVExtractions" SET "Status"=$3,"ExtractedProfile"=$4,"Profile"=$4,"Failure"=$5,"UpdatedAt"=now(),"Revision"="Revision"+1
    WHERE "CVFileID"=$1 AND "RequestToken"=$2 AND "Status"='PROCESSING' RETURNING *`,
   [cvFileId,prepared.token,failure?'FAILED':'NEEDS_REVIEW',profile?JSON.stringify(profile):null,failure?JSON.stringify(failure):null])).rows[0];
  if(!r)throw invalid('Tác vụ CV đã được thay thế; tải lại trạng thái.',409,'CV_ANALYSIS_SUPERSEDED');
  await audit(c,actor.userId,'StudentCVExtractions',r.AnalysisID,'ANALYZE_CV',null,{cvFileId,status:r.Status,model:r.Model});
  return {analysis:analysisApi(r),replayed:false};
 }));
}

export async function updateMatchingProfile(body:unknown,actor:Actor) {
 const b=inputObject(body,['analysisId','revision','profile','confirm']);
 const id=positiveId(b.analysisId,'analysisId'),revision=positiveId(b.revision,'revision');
 if(typeof b.confirm!=='boolean')throw invalid('confirm must be boolean.');
 const profile=validateCvProfile(b.profile);
 return migrationGuard(()=>academicTransaction(async c=>{
  const student=await lockStudent(c,actor),cv=await currentCV(c,student.StudentID);
  const r=(await c.query('SELECT * FROM "StudentCVExtractions" WHERE "AnalysisID"=$1 AND "StudentID"=$2 FOR UPDATE',[id,student.StudentID])).rows[0];
  if(!r)throw invalid('Không tìm thấy kết quả đọc CV của bạn.',404,'CV_ANALYSIS_NOT_FOUND');
  const latest=cv?(await c.query('SELECT max("AnalysisID") AS id FROM "StudentCVExtractions" WHERE "CVFileID"=$1 AND "StudentID"=$2 AND "SchemaVersion"=$3 AND ($4::text IS NULL OR "Model"=$4)',[cv.id,student.StudentID,CV_SCHEMA_VERSION,process.env.CLAUDE_CV_MODEL?.trim()||null])).rows[0].id:null;
  if(!cv||r.CVFileID!==cv.id||r.AnalysisID!==latest)throw invalid('Phiên bản CV/kết quả đã thay đổi; hãy tải lại.',409,'CV_VERSION_CHANGED');
  if(r.Revision!==revision)throw invalid('Hồ sơ đã được chỉnh sửa; hãy tải lại phiên bản mới.',409,'CV_PROFILE_CONFLICT');
  if(!['NEEDS_REVIEW','CONFIRMED'].includes(r.Status))throw invalid('Chưa có kết quả hợp lệ để xác nhận.',409,'CV_PROFILE_NOT_READY');
  const saved=(await c.query(`UPDATE "StudentCVExtractions" SET "Profile"=$2,"Status"=$3,"Revision"="Revision"+1,
   "ConfirmedAt"=CASE WHEN $4 THEN now() ELSE NULL END,"UpdatedAt"=now() WHERE "AnalysisID"=$1 RETURNING *`,[id,JSON.stringify(profile),b.confirm?'CONFIRMED':'NEEDS_REVIEW',b.confirm])).rows[0];
  await audit(c,actor.userId,'StudentCVExtractions',id,b.confirm?'CONFIRM_CV_PROFILE':'EDIT_CV_PROFILE',
   {revision:r.Revision,status:r.Status},{revision:saved.Revision,status:saved.Status});
  return {analysis:analysisApi(saved)};
 }));
}
