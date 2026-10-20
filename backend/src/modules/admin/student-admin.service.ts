import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid, inputObject, positiveId, requiredText, optionalText } from '../students/student.validation';
import { listStudents } from '../students/student.service';

// Link a STUDENT account created through /accounts; do not create a second account.
export async function createStudent(body:unknown,actor:number) {
 const b=inputObject(body,['userId','studentCode','programId','enrollmentYear','currentSemester','className']);
 const userId=positiveId(b.userId,'userId'),code=requiredText(b.studentCode,'studentCode',20).toUpperCase();
 const enrollmentYear=b.enrollmentYear==null?null:positiveId(b.enrollmentYear,'enrollmentYear');
 if(enrollmentYear&&(enrollmentYear<1900||enrollmentYear>2200))throw invalid('Invalid enrollmentYear.');
 const semester=b.currentSemester==null?null:positiveId(b.currentSemester,'currentSemester');
 if(semester&&semester>100)throw invalid('currentSemester must not exceed 100.');
 return academicTransaction(async c=>{
  const user=(await c.query(`SELECT u."UserID",u."Status",r."RoleCode" FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."UserID"=$1 FOR UPDATE OF u`,[userId])).rows[0];
  if(!user||user.RoleCode!=='STUDENT'||user.Status!=='ACTIVE')throw invalid('An active STUDENT account is required.',422);
  const row=(await c.query(`INSERT INTO "Students" ("UserID","StudentCode","ProgramID","EnrollmentYear","CurrentSemester","ClassName","Status") VALUES ($1,$2,$3,$4,$5,$6,'ACTIVE') RETURNING "StudentID" AS id,"UserID" AS "userId","StudentCode" AS "studentCode","ProgramID" AS "programId","Status" AS status`,[userId,code,b.programId==null?null:positiveId(b.programId,'programId'),enrollmentYear,semester,optionalText(b.className,'className',20)])).rows[0];
  await audit(c,actor,'Students',row.id,'CREATE',null,row);return row;
 });
}
export async function deleteStudent(id:number,actor:number) {
 return academicTransaction(async c=>{
  const old=(await c.query('SELECT * FROM "Students" WHERE "StudentID"=$1 AND "DeletedAt" IS NULL FOR UPDATE',[id])).rows[0];if(!old)throw invalid('Student not found.',404);
  if((await c.query(`SELECT 1 FROM "InternshipAssignments" WHERE "StudentID"=$1 AND COALESCE("Status",'ACTIVE') NOT IN ('COMPLETED','CANCELLED') LIMIT 1`,[id])).rowCount)throw invalid('Active assignments prevent deletion.',409);
  await c.query(`UPDATE "Students" SET "DeletedAt"=now(),"Status"='INACTIVE' WHERE "StudentID"=$1`,[id]);
  await c.query(`UPDATE "Users" SET "Status"='INACTIVE',"AuthVersion"="AuthVersion"+1,"UpdatedAt"=now() WHERE "UserID"=$1`,[old.UserID]);
  await audit(c,actor,'Students',id,'SOFT_DELETE',old,{deleted:true});
 });
}
export async function exportStudents(params:Record<string,unknown>) {
 // Reuse the same validated filters and cap exports, with stable ID ordering.
 if(params.page!==undefined||params.limit!==undefined)throw invalid('Export does not accept page or limit.');
 return (await listStudents(params,true)).items;
}
