import { academicTransaction } from '../academic/academic.repository';
import { encryptEmail } from '../imports/email.crypto';

// Persist recipients and the outbox together. Concurrent workers cannot queue a result twice.
export async function notifyCompletedInternships() {
  return academicTransaction(async c=>{
    const evaluations=(await c.query(`SELECT ev.*,s."UserID" AS "StudentUserID",s."StudentCode",u."FullName",e."Name" AS "EnterpriseName"
      FROM "InternshipEvaluations" ev JOIN "InternshipAssignments" a ON a."AssignmentID"=ev."AssignmentID"
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTSemesters" term ON term."OJTSemesterID"=co."OJTSemesterID"
      JOIN "Students" s ON s."StudentID"=a."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID"
      WHERE ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND a."Status" IN ('ACTIVE','IN_PROGRESS','COMPLETED','FAILED')
      AND GREATEST(a."EndDate",term."EndDate") < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      AND NOT EXISTS (SELECT 1 FROM "OJTCompletionDeliveries" d WHERE d."EvaluationID"=ev."EvaluationID" AND d."EvaluatedAt"=ev."EvaluatedAt")
      ORDER BY ev."EvaluationID" LIMIT 100`)).rows;
    let queued=0;
    for(const ev of evaluations){
      const recipients=(await c.query(`SELECT u."UserID",u."Email" FROM "Users" u JOIN "Roles" r ON r."RoleID"=u."RoleID" WHERE u."Status"='ACTIVE' AND (u."UserID"=$1 OR r."RoleCode"='OJT_COORD')`,[ev.StudentUserID])).rows;
      const subject=`Kết quả đánh giá OJT - ${ev.StudentCode}`;
      const text=`Sinh viên: ${ev.FullName} (${ev.StudentCode})\nDoanh nghiệp: ${ev.EnterpriseName}\nĐiểm hoàn thành: ${ev.CompletionScore}\nThái độ: ${ev.AttitudeScore}\nKỹ năng: ${ev.SkillScore}\nTổng điểm: ${ev.OverallScore}\nNhận xét: ${ev.Comments??''}\nĐây là đánh giá của doanh nghiệp; điểm chính thức được xác nhận theo quy trình đào tạo.`;
      for(const r of recipients){
        await c.query(`INSERT INTO "Notifications" ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt") VALUES ($1,$2,$3,'IN_APP','OJT_EVALUATION',$4,now())`,[r.UserID,subject,text,ev.EvaluationID]);
        const email=(await c.query(`INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt","Kind") VALUES ($1,$2,$3,now()+interval '30 days','OJT_RESULT') RETURNING "EmailID"`,[r.UserID,r.Email,encryptEmail({subject,text})])).rows[0];
        await c.query(`INSERT INTO "OJTCompletionDeliveries" ("EvaluationID","EvaluatedAt","UserID","EmailID") VALUES ($1,$2,$3,$4)`,[ev.EvaluationID,ev.EvaluatedAt,r.UserID,email.EmailID]);
        queued++;
      }
    }
    return queued;
  });
}
