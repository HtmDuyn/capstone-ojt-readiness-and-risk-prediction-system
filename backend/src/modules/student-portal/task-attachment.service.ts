import multer from 'multer';
import type { RequestHandler } from 'express';
import type { PoolClient } from 'pg';
import { invalid } from '../students/student.validation';
import { readTransaction } from '../qhdn/read.repository';
import { enterpriseScope } from '../qhdn/qhdn.repository';
import { ownStudent, type Actor } from './shared';

export const maxTaskAttachmentSize = 10 * 1024 * 1024;
export function validateTaskAttachment(file: Express.Multer.File) {
  if (!file.buffer.length || file.buffer.length > maxTaskAttachmentSize) {
    throw invalid('File bài làm phải có dung lượng từ 1 byte đến 10 MB.', 413);
  }
  const decoded = Buffer.from(file.originalname, 'latin1').toString('utf8');
  const name = /^[\x00-\xff]*$/.test(file.originalname) && !decoded.includes('\ufffd') ? decoded : file.originalname;
  file.originalname = name.split(/[\\/]/).pop()!.replace(/[\x00-\x1f\x7f]/g, '').slice(-255);
  const ext = file.originalname.split('.').pop()?.toLowerCase();
  const bytes = file.buffer;
  const zip = bytes.subarray(0, 4).equals(Buffer.from([80,75,3,4])) || bytes.subarray(0, 4).equals(Buffer.from([80,75,5,6]));
  const ole = bytes.subarray(0, 8).equals(Buffer.from([208,207,17,224,161,177,26,225]));
  const types: Record<string, string> = {
    pdf: 'application/pdf', doc: 'application/msword', docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    xls: 'application/vnd.ms-excel', xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ppt: 'application/vnd.ms-powerpoint', pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    zip: 'application/zip', png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', txt: 'text/plain',
  };
  let valid = false;
  if (ext === 'pdf') valid = bytes.subarray(0, 5).toString() === '%PDF-' && bytes.subarray(-2048).includes(Buffer.from('%%EOF'));
  if (ext === 'png') valid = bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  if (ext === 'jpg' || ext === 'jpeg') valid = bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255;
  if (ext === 'zip') valid = zip;
  if (ext && ['doc','xls','ppt'].includes(ext)) valid = ole;
  if (ext && ['docx','xlsx','pptx'].includes(ext)) {
    valid = zip && bytes.includes(Buffer.from('[Content_Types].xml'))
      && bytes.includes(Buffer.from(ext === 'docx' ? 'word/' : ext === 'xlsx' ? 'xl/' : 'ppt/'));
  }
  if (ext === 'txt') {
    try { new TextDecoder('utf-8', { fatal: true }).decode(bytes); valid = !bytes.includes(0); } catch { valid = false; }
  }
  if (!ext || !types[ext] || !valid) {
    throw invalid('Chọn file PDF, Word, Excel, PowerPoint, ZIP, PNG, JPG hoặc TXT đúng định dạng.', 400, 'INVALID_TASK_ATTACHMENT');
  }
  file.mimetype = types[ext];
  return file;
}

const upload = multer({ storage: multer.memoryStorage(), limits: {
  fileSize: maxTaskAttachmentSize, files: 1, fields: 1, fieldSize: 40000, parts: 2,
} }).single('attachment');
export const receiveTaskSubmission: RequestHandler = (req, res, next) => {
  if (req.is('application/json')) return next();
  if (!req.is('multipart/form-data')) return next(invalid('Dùng JSON hoặc multipart/form-data để nộp bài.', 415));
  upload(req, res, error => {
    if (error) return next(invalid(error.code === 'LIMIT_FILE_SIZE' ? 'File bài làm tối đa 10 MB.' : 'Dữ liệu đính kèm không hợp lệ.', error.code === 'LIMIT_FILE_SIZE' ? 413 : 400));
    // Validate once in submitTask, before opening the database transaction.
    next();
  });
};

export const taskAttachmentMetadata = (alias: string) => `CASE WHEN ${alias}."AttachmentContent" IS NULL THEN NULL ELSE jsonb_build_object(
  'fileName',${alias}."AttachmentName",'mimeType',${alias}."AttachmentMimeType",'size',octet_length(${alias}."AttachmentContent"),'sha256',${alias}."AttachmentSha256") END`;

export async function taskSubmissionScope(client: PoolClient, taskId: number, actor: Actor) {
  if (actor.roleCode === 'STUDENT') {
    const student = await ownStudent(client, actor);
    const task = (await client.query(`SELECT a."StudentID" FROM "InternshipTasks" t
      JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID"
      WHERE t."TaskID"=$1 AND a."StudentID"=$2`, [taskId, student.StudentID])).rows[0];
    if (!task) throw invalid('Không tìm thấy nhiệm vụ.', 404, 'TASK_NOT_FOUND');
    return task.StudentID as number;
  }
  const companyId = await enterpriseScope(client, actor);
  const task = (await client.query(`SELECT a."StudentID",a."EnterpriseID" FROM "InternshipTasks" t
    JOIN "InternshipAssignments" a ON a."AssignmentID"=t."AssignmentID" WHERE t."TaskID"=$1`, [taskId])).rows[0];
  if (!task) throw invalid('Không tìm thấy nhiệm vụ.', 404, 'TASK_NOT_FOUND');
  if (companyId !== null && task.EnterpriseID !== companyId) throw invalid('Không có quyền xem bài nộp này.', 403, 'FORBIDDEN');
  return task.StudentID as number;
}

export async function readTaskAttachment(id: number, actor: Actor) {
  return readTransaction(async client => {
    const record = (await client.query('SELECT "TaskID","UpdatedByStudentID" FROM "TaskProgressUpdates" WHERE "UpdateID"=$1', [id])).rows[0];
    if (!record) throw invalid('Không tìm thấy bài nộp.', 404);
    const studentId = await taskSubmissionScope(client, record.TaskID, actor);
    if (record.UpdatedByStudentID !== studentId) throw invalid('Không có quyền tải file bài nộp.', 403, 'FORBIDDEN');
    const file = (await client.query(`SELECT "AttachmentName" AS "FileName","AttachmentMimeType" AS "MimeType","AttachmentContent" AS "Content"
      FROM "TaskProgressUpdates" WHERE "UpdateID"=$1`, [id])).rows[0];
    if (!file?.Content) throw invalid('Bài nộp không có file đính kèm.', 404, 'TASK_ATTACHMENT_NOT_FOUND');
    return file;
  });
}
