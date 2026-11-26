import multer from 'multer';
import type { RequestHandler } from 'express';
import type { PoolClient } from 'pg';
import { createHash } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { readTransaction } from '../qhdn/read.repository';
import { enterpriseScope, type Actor } from '../qhdn/qhdn.repository';
import { invalid } from '../students/student.validation';

const maxSize = 10 * 1024 * 1024;
export function validateCertificateFile(file: Express.Multer.File) {
  if (!file.buffer.length || file.buffer.length > maxSize) throw invalid('Chứng chỉ tối đa 10 MB.', 413);
  const bytes = file.buffer;
  const pdf = /\.pdf$/i.test(file.originalname) && bytes.subarray(0, 5).toString() === '%PDF-'
    && bytes.subarray(-2048).includes(Buffer.from('%%EOF'));
  const png = /\.png$/i.test(file.originalname) && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const jpeg = /\.jpe?g$/i.test(file.originalname) && bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  const mime = pdf ? 'application/pdf' : png ? 'image/png' : jpeg ? 'image/jpeg' : null;
  if (!mime || file.mimetype !== mime) throw invalid('Chỉ nhận chứng chỉ PDF, JPG hoặc PNG đúng định dạng.', 400, 'INVALID_CERTIFICATE_FILE');
  // Multipart filename headers are decoded as Latin-1 by multer. Recover UTF-8
  // names when possible, while preserving filenames already supplied as Unicode.
  const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const name = /^[\x00-\xff]*$/.test(file.originalname) && !decoded.includes('\ufffd') ? decoded : file.originalname;
  file.originalname = name.split(/[\\/]/).pop()!.replace(/[\x00-\x1f\x7f]/g, '').slice(-255);
  return file;
}
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: maxSize, files: 1, fields: 0, parts: 1 } }).single('certificate');
export const receiveCertificate: RequestHandler = (req, res, next) => {
  upload(req, res, error => {
    try {
      if (error) throw invalid(error.code === 'LIMIT_FILE_SIZE' ? 'Chứng chỉ tối đa 10 MB.' : 'Dữ liệu tải chứng chỉ không hợp lệ.', error.code === 'LIMIT_FILE_SIZE' ? 413 : 400);
      if (!req.is('multipart/form-data') || !req.file) throw invalid('Chọn file chứng chỉ PDF, JPG hoặc PNG.');
      validateCertificateFile(req.file);
      next();
    } catch (error) { next(error); }
  });
};

const published = `EXISTS (SELECT 1 FROM "InternshipEvaluations" ev JOIN "Notifications" n
  ON n."RelatedEntityType"='OJT_RESULT_PUBLISHED' AND n."RelatedEntityID"=ev."EvaluationID" AND n."UserID"=s."UserID"
  WHERE ev."AssignmentID"=a."AssignmentID" AND ev."Status"='SUBMITTED' AND ev."OverallScore" IS NOT NULL)`;
const metadata = `cert."CertificateID" AS id,cert."AssignmentID" AS "assignmentId",cert."FileName" AS "fileName",
  cert."MimeType" AS "mimeType",octet_length(cert."Content") AS size,cert."UploadedAt" AS "uploadedAt",
  cert."UploadedRole" AS "uploadedRole",cert."Sha256" AS sha256`;
const context = `FROM "OjtCompletionCertificates" cert
  JOIN "InternshipAssignments" a ON a."AssignmentID"=cert."AssignmentID"
  JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
  JOIN "Students" s ON s."StudentID"=a."StudentID"
  JOIN "Enterprises" e ON e."EnterpriseID"=a."EnterpriseID"
  JOIN "OJTSemesters" term ON term."OJTSemesterID"=co."OJTSemesterID"`;

async function assignmentScope(c: PoolClient, assignmentId: number, actor: Actor, write = false) {
  if (write && !['ENTERPRISE','OJT_COORD','ADMIN'].includes(actor.roleCode)) throw invalid('Không có quyền tải chứng chỉ.', 403, 'FORBIDDEN');
  const row = (await c.query(`SELECT a."EnterpriseID",a."Status",s."UserID",${published} AS published
    FROM "InternshipAssignments" a JOIN "Students" s ON s."StudentID"=a."StudentID"
    WHERE a."AssignmentID"=$1 AND s."DeletedAt" IS NULL ${write ? 'FOR UPDATE OF a' : ''}`, [assignmentId])).rows[0];
  if (!row) throw invalid('Không tìm thấy hồ sơ thực tập.', 404);
  if (actor.roleCode === 'STUDENT') {
    if (row.UserID !== actor.userId || !row.published) throw invalid('Không có quyền xem chứng chỉ này.', 403, 'FORBIDDEN');
  } else {
    const companyId = await enterpriseScope(c, actor);
    if (companyId !== null && row.EnterpriseID !== companyId) throw invalid('Sinh viên không thuộc doanh nghiệp của bạn.', 403, 'FORBIDDEN');
  }
  if (!['ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED'].includes(row.Status?.toUpperCase())) throw invalid('Hồ sơ thực tập không còn hợp lệ để xem hoặc tải chứng chỉ.', 409);
}
export async function getAssignmentCertificate(assignmentId: number, actor: Actor) {
  return readTransaction(async c => {
    await assignmentScope(c, assignmentId, actor);
    return (await c.query(`SELECT ${metadata} ${context} WHERE cert."AssignmentID"=$1`, [assignmentId])).rows[0] ?? null;
  });
}
export async function uploadCertificate(assignmentId: number, file: Express.Multer.File, actor: Actor) {
  validateCertificateFile(file);
  return academicTransaction(async c => {
    await assignmentScope(c, assignmentId, actor, true);
    const before = (await c.query(`SELECT ${metadata} ${context} WHERE cert."AssignmentID"=$1`, [assignmentId])).rows[0] ?? null;
    const hash = createHash('sha256').update(file.buffer).digest('hex');
    if (before?.sha256 === hash && before.fileName === file.originalname) return before;
    await c.query(`INSERT INTO "OjtCompletionCertificates" ("AssignmentID","FileName","MimeType","Content","Sha256","UploadedBy","UploadedRole")
      VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT ("AssignmentID") DO UPDATE SET
      "FileName"=EXCLUDED."FileName","MimeType"=EXCLUDED."MimeType","Content"=EXCLUDED."Content",
      "Sha256"=EXCLUDED."Sha256","UploadedBy"=EXCLUDED."UploadedBy","UploadedRole"=EXCLUDED."UploadedRole","UploadedAt"=clock_timestamp()`,
      [assignmentId,file.originalname,file.mimetype,file.buffer,hash,actor.userId,actor.roleCode]);
    const after = (await c.query(`SELECT ${metadata} ${context} WHERE cert."AssignmentID"=$1`, [assignmentId])).rows[0];
    await audit(c, actor.userId, 'OjtCompletionCertificates', after.id, before ? 'REPLACE_CERTIFICATE' : 'UPLOAD_CERTIFICATE', before, after);
    return after;
  });
}
export async function readCertificateFile(id: number, actor: Actor) {
  return readTransaction(async c => {
    const record = (await c.query('SELECT "AssignmentID" FROM "OjtCompletionCertificates" WHERE "CertificateID"=$1', [id])).rows[0];
    if (!record) throw invalid('Không tìm thấy chứng chỉ.', 404);
    await assignmentScope(c, record.AssignmentID, actor);
    return (await c.query('SELECT "FileName","MimeType","Content" FROM "OjtCompletionCertificates" WHERE "CertificateID"=$1', [id])).rows[0];
  });
}
export async function studentCertificates(semesterId: number, actor: Actor) {
  if (actor.roleCode !== 'STUDENT') throw invalid('Chỉ sinh viên được xem chứng chỉ của mình.', 403, 'FORBIDDEN');
  return readTransaction(async c => (await c.query(`SELECT ${metadata},e."Name" AS "enterpriseName",term."SemesterCode" AS "semesterCode"
    ${context} WHERE s."UserID"=$1 AND co."OJTSemesterID"=$2 AND s."DeletedAt" IS NULL
      AND UPPER(a."Status") IN ('ASSIGNED','ACTIVE','IN_PROGRESS','COMPLETED') AND ${published}
    ORDER BY cert."UploadedAt" DESC,cert."CertificateID" DESC`, [actor.userId,semesterId])).rows);
}
