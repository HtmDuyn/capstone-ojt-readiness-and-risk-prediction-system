import { academicTransaction } from '../academic/academic.repository';
import { encryptEmail } from '../imports/email.crypto';

// Persist recipients and the outbox together. Concurrent workers cannot queue a result twice.
export async function notifyCompletedInternships() {
  return academicTransaction(async c=>{
    const evaluations=(await c.query(`SELECT ev.*,result."OfficialScore" AS "ConfirmedScore",s."UserID" AS "StudentUserID",s."StudentCode",u."FullName",e."Name" AS "EnterpriseName"
      FROM "InternshipEvaluations" ev JOIN "OJTResults" result ON result."AssignmentID"=ev."AssignmentID" AND result."Status"='CONFIRMED' JOIN "InternshipAssignments" a ON a."AssignmentID"=ev."AssignmentID"
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "OJTSemesters" term ON term."OJTSemesterID"=co."OJTSemesterID"
      JOIN "Students" s ON s."StudentID"=a."StudentID" JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID"
      WHERE ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL AND a."Status" IN ('ACTIVE','IN_PROGRESS','COMPLETED','FAILED')
      AND ev."OverallScore" IS NOT NULL
      AND GREATEST(a."EndDate",term."EndDate") < (now() AT TIME ZONE 'Asia/Ho_Chi_Minh')::date
      AND NOT EXISTS (SELECT 1 FROM "OJTCompletionDeliveries" d WHERE d."EvaluationID"=ev."EvaluationID" AND d."EvaluatedAt"=ev."EvaluatedAt")
      ORDER BY ev."EvaluationID" LIMIT 100 FOR UPDATE OF ev SKIP LOCKED`)).rows;
    let queued=0;
    for(const ev of evaluations){
      const recipients=(await c.query(`SELECT u."UserID",u."Email" FROM "Users" u WHERE u."Status"='ACTIVE' AND u."UserID"=$1`,[ev.StudentUserID])).rows;
      const subject=`Kết quả đánh giá OJT - ${ev.StudentCode}`;
      const text=`Sinh viên: ${ev.FullName} (${ev.StudentCode})\nDoanh nghiệp: ${ev.EnterpriseName}\nĐiểm hoàn thành: ${ev.CompletionScore}\nThái độ: ${ev.AttitudeScore}\nKỹ năng: ${ev.SkillScore}\nĐiểm OJT chính thức: ${ev.ConfirmedScore}\nNhận xét: ${ev.Comments??''}\nKết quả đã được QHDN chuyển và Phòng đào tạo xác nhận, ghi nhận vào dữ liệu học vụ.`;
      for(const r of recipients){
        await c.query(`INSERT INTO "Notifications" ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt") VALUES ($1,$2,$3,'IN_APP','OJT_EVALUATION',$4,now())`,[r.UserID,subject,text,ev.EvaluationID]);
        const email=(await c.query(`INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt","Kind") VALUES ($1,$2,$3,now()+interval '30 days','OJT_RESULT') RETURNING "EmailID"`,[r.UserID,r.Email,encryptEmail({subject,text})])).rows[0];
        // Copy the timestamp inside PostgreSQL; a JS Date round-trip can shift a timestamp-without-time-zone.
        await c.query(`INSERT INTO "OJTCompletionDeliveries" ("EvaluationID","EvaluatedAt","UserID","EmailID")
          SELECT "EvaluationID","EvaluatedAt",$2,$3 FROM "InternshipEvaluations" WHERE "EvaluationID"=$1`,[ev.EvaluationID,r.UserID,email.EmailID]);
        queued++;
      }
    }
    return queued;
  });
}
