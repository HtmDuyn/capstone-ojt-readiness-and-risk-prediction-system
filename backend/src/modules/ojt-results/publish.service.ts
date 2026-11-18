import { encryptEmail } from '../imports/email.crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { inputObject, invalid, positiveId, requiredText } from '../students/student.validation';

type PublishActor = { userId: number; roleCode: string };
type ResultRow = {
  EvaluationID: number;
  UserID: number;
  StudentID: number;
  StudentStatus: string;
  StudentDeletedAt: Date | null;
  StudentCode: string;
  FullName: string;
  Email: string | null;
  UserStatus: string;
  EnterpriseName: string;
  CompletionScore: number | string | null;
  SkillScore: number | string | null;
  AttitudeScore: number | string | null;
  OverallScore: number | string | null;
  Comments: string | null;
  PublishedToStudent: boolean;
};

const publicationType = 'OJT_RESULT_PUBLISHED';
const displayScore = (value: number | string | null) => value == null ? '—' : Number(value).toFixed(2);

export async function publishResults(body: unknown, actor: PublishActor) {
  if (!['ADMIN', 'OJT_COORD'].includes(actor.roleCode)) {
    throw invalid('Only QHDN can publish OJT results.', 403, 'FORBIDDEN');
  }
  const input = inputObject(body, ['ojtSemesterId', 'evaluationIds', 'reason']);
  const semesterId = positiveId(input.ojtSemesterId, 'ojtSemesterId');
  const reason = requiredText(input.reason, 'reason', 2000);
  let evaluationIds: number[] | undefined;
  if (input.evaluationIds !== undefined) {
    if (!Array.isArray(input.evaluationIds) || input.evaluationIds.length < 1 || input.evaluationIds.length > 500) {
      throw invalid('evaluationIds must contain between 1 and 500 evaluation IDs.');
    }
    evaluationIds = input.evaluationIds.map(id => positiveId(id, 'evaluationIds'));
    if (new Set(evaluationIds).size !== evaluationIds.length) {
      throw invalid('evaluationIds must not contain duplicates.');
    }
  }

  return academicTransaction(async client => {
    if (!(await client.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1', [semesterId])).rowCount) {
      throw invalid('OJT semester not found.', 404);
    }
    const values: unknown[] = [semesterId];
    const selectedFilter = evaluationIds
      ? `AND ev."EvaluationID"=ANY($2::int[])`
      : '';
    if (evaluationIds) values.push(evaluationIds);
    const rows = (await client.query<ResultRow>(`
      SELECT ev."EvaluationID",u."UserID",s."StudentID",s."Status" AS "StudentStatus",s."DeletedAt" AS "StudentDeletedAt",
        s."StudentCode",u."FullName",u."Email",u."Status" AS "UserStatus",
        e."Name" AS "EnterpriseName",ev."CompletionScore",ev."SkillScore",ev."AttitudeScore",ev."OverallScore",ev."Comments",
        EXISTS(SELECT 1 FROM "Notifications" n WHERE n."UserID"=u."UserID"
          AND n."RelatedEntityType"=$${values.length + 1} AND n."RelatedEntityID"=ev."EvaluationID") AS "PublishedToStudent"
      FROM "InternshipEvaluations" ev
      JOIN "InternshipAssignments" a ON a."AssignmentID"=ev."AssignmentID"
      JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
      JOIN "Students" s ON s."StudentID"=a."StudentID"
      JOIN "Users" u ON u."UserID"=s."UserID"
      JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID"
      WHERE co."OJTSemesterID"=$1 AND ev."Status"='SUBMITTED' AND ev."EvaluatedAt" IS NOT NULL
        AND ev."OverallScore" IS NOT NULL AND UPPER(a."Status") NOT IN ('CANCELLED','CANCELED')
        ${selectedFilter}
      ORDER BY ev."EvaluationID"
      FOR UPDATE OF ev
    `, [...values, publicationType])).rows;
    if (evaluationIds && rows.length !== evaluationIds.length) {
      throw invalid('Some selected evaluations are not eligible for publication in this OJT semester.', 409, 'PUBLISH_SELECTION_NOT_ELIGIBLE');
    }

    let published = 0;
    let alreadyPublished = 0;
    let skipped = 0;
    let queuedEmails = 0;
    for (const result of rows) {
      if (result.PublishedToStudent) {
        alreadyPublished++;
        continue;
      }
      if (result.StudentStatus !== 'ACTIVE' || result.StudentDeletedAt || result.UserStatus !== 'ACTIVE') {
        skipped++;
        continue;
      }

      const title = `Công bố kết quả đánh giá OJT - ${result.StudentCode}`;
      const text = [
        `Xin chào ${result.FullName} (${result.StudentCode}),`,
        `Doanh nghiệp: ${result.EnterpriseName}`,
        `Kỹ năng chuyên ngành: ${displayScore(result.CompletionScore)}`,
        `Kỹ năng mềm: ${displayScore(result.SkillScore)}`,
        `Thái độ: ${displayScore(result.AttitudeScore)}`,
        `Điểm trung bình: ${displayScore(result.OverallScore)}`,
        result.Comments ? `Nhận xét: ${result.Comments}` : '',
        'Kết quả OJT đã được Phòng Quan hệ doanh nghiệp công bố. Bạn có thể xem điểm và nhận xét tại mục Kết quả đánh giá OJT.',
      ].filter(Boolean).join('\n');
      await client.query(
        `INSERT INTO "Notifications" ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt")
         VALUES ($1,$2,$3,'IN_APP',$4,$5,now())`,
        [result.UserID, title, text, publicationType, result.EvaluationID],
      );
      if (result.Email?.trim()) {
        await client.query(
          `INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt","Kind")
           VALUES ($1,$2,$3,now()+interval '30 days','OJT_RESULT')`,
          [result.UserID, result.Email.trim(), encryptEmail({ subject: title, text })],
        );
        queuedEmails++;
      }
      published++;
    }

    const summary = { ojtSemesterId: semesterId, eligible: rows.length, published, alreadyPublished, skipped, queuedEmails };
    if (published || skipped) {
      await audit(client, actor.userId, 'OJTSemesters', semesterId, 'PUBLISH_OJT_RESULTS', null, summary, reason);
    }
    return summary;
  });
}
