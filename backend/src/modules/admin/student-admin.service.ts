import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid } from '../students/student.validation';
import { listStudents } from '../students/student.service';
export async function deleteStudent(id:number,actor:number) {
 return academicTransaction(async c=>{
  const old=(await c.query('SELECT * FROM "Students" WHERE "StudentID"=$1 AND "DeletedAt" IS NULL FOR UPDATE',[id])).rows[0];if(!old)throw invalid('Student not found.',404);
  if((await c.query(`SELECT 1 FROM "InternshipAssignments" WHERE "StudentID"=$1 AND COALESCE("Status",'ACTIVE') NOT IN ('COMPLETED','CANCELLED') LIMIT 1`,[id])).rowCount)throw invalid('Active assignments prevent deletion.',409);
  const student=(await c.query(`UPDATE "Students" SET "DeletedAt"=now(),"Status"='INACTIVE' WHERE "StudentID"=$1 RETURNING "StudentID" AS id,"StudentCode" AS "studentCode","UserID" AS "userId","Status" AS status,"DeletedAt" AS "deletedAt"`,[id])).rows[0];
  const account=(await c.query(`UPDATE "Users" SET "Status"='INACTIVE',"AuthVersion"="AuthVersion"+1,"UpdatedAt"=now() WHERE "UserID"=$1 RETURNING "UserID" AS id,"Username" AS username,"Email" AS email,"FullName" AS "fullName","Status" AS status`,[old.UserID])).rows[0]??null;
  await audit(c,actor,'Students',id,'SOFT_DELETE',old,{deleted:true});
  return {student,account};
 });
}
export async function exportStudents(params:Record<string,unknown>) {
 // Reuse the same validated filters and cap exports, with stable ID ordering.
 if(params.page!==undefined||params.limit!==undefined)throw invalid('Export does not accept page or limit.');
 return (await listStudents(params,true)).items;
}
