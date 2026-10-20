import multer from 'multer';
import type { RequestHandler } from 'express';
import { invalid } from './student.validation';
import { createHash } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import type { PoolClient } from 'pg';
import { readTransaction } from '../qhdn/read.repository';
import type { Actor } from '../ojt-registration/window.service';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1, fields: 3, fieldSize: 16384, parts: 4 },
}).single('cv');

export const receiveCV: RequestHandler = (req, res, next) => {
  upload(req, res, error => {
    try {
      if (error) throw invalid(error.code === 'LIMIT_FILE_SIZE' ? 'CV tối đa 10 MB.' : 'Dữ liệu upload CV không hợp lệ.', error.code === 'LIMIT_FILE_SIZE' ? 413 : 400, 'INVALID_CV_UPLOAD');
      if (!req.is('multipart/form-data') || !req.file) throw invalid('Gửi file PDF trong trường cv bằng multipart/form-data.');
      if (Object.keys(req.body??{}).length) throw invalid('API upload CV chỉ nhận trường file cv.');
      if (req.file) {
        const file = req.file;
        if (file.mimetype !== 'application/pdf' || !/\.pdf$/i.test(file.originalname) || !file.buffer.subarray(0,5).equals(Buffer.from('%PDF-')) || !file.buffer.subarray(-2048).includes(Buffer.from('%%EOF'))) {
          throw invalid('CV phải là file PDF hợp lệ.', 400, 'INVALID_CV_FILE');
        }
        file.originalname = file.originalname.split(/[\\/]/).pop()!.replace(/[\x00-\x1f\x7f]/g, '').slice(0,255);
      }
      next();
    } catch (error) { next(error); }
  });
};

export const cvMetadataSql=(alias:string)=>`jsonb_build_object('id',${alias}."CVFileID",'studentId',${alias}."StudentID",'fileName',${alias}."FileName",'mimeType',${alias}."MimeType",'size',octet_length(${alias}."Content"),'sha256',${alias}."Sha256",'uploadedAt',${alias}."UploadedAt")`;
export const currentCVSql=(student:string)=>`(SELECT ${cvMetadataSql('cv')} FROM "StudentCVFiles" cv WHERE cv."StudentID"=${student} ORDER BY cv."CVFileID" DESC LIMIT 1)`;
export async function currentCV(c:PoolClient,studentId:number) {
 return (await c.query(`SELECT ${currentCVSql('$1')} AS cv`,[studentId])).rows[0].cv;
}
export async function uploadStudentCV(file:Express.Multer.File,actor:Actor) {
 if(actor.roleCode!=='STUDENT')throw invalid('Chỉ sinh viên được tải CV của mình.',403,'FORBIDDEN');
 return academicTransaction(async c=>{
  const s=(await c.query(`SELECT s."StudentID" FROM "Students" s JOIN "Users" u ON u."UserID"=s."UserID" WHERE s."UserID"=$1 AND s."DeletedAt" IS NULL AND s."Status"='ACTIVE' AND u."Status"='ACTIVE' FOR UPDATE OF s`,[actor.userId])).rows[0];
  if(!s)throw invalid('Không tìm thấy hồ sơ sinh viên đang hoạt động.',404,'STUDENT_NOT_FOUND');
  const before=await currentCV(c,s.StudentID),hash=createHash('sha256').update(file.buffer).digest('hex');
  if(before?.sha256===hash&&before.fileName===file.originalname)return {...before,replayed:true};
  await c.query(`INSERT INTO "StudentCVFiles" ("StudentID","FileName","MimeType","Content","Sha256","UploadedBy") VALUES ($1,$2,'application/pdf',$3,$4,$5)`,[s.StudentID,file.originalname,file.buffer,hash,actor.userId]);
  const cv=await currentCV(c,s.StudentID);await audit(c,actor.userId,'StudentCVFiles',cv.id,'UPLOAD_CV',before,cv);return {...cv,replayed:false};
 });
}
export async function readCV(studentId:number,actor:Actor,cvFileId?:number) {
 return readTransaction(async c=>{
  const s=(await c.query('SELECT "UserID" FROM "Students" WHERE "StudentID"=$1 AND "DeletedAt" IS NULL',[studentId])).rows[0];
  if(!s)throw invalid('Không tìm thấy sinh viên.',404,'STUDENT_NOT_FOUND');
  const own=actor.roleCode==='STUDENT'&&s.UserID===actor.userId;
  const coordinator=actor.roleCode==='OJT_COORD'&&(await c.query('SELECT 1 FROM "OJTRegistrations" WHERE "StudentID"=$1',[studentId])).rowCount;
  if(!own&&!['ADMIN','ACADEMIC'].includes(actor.roleCode)&&!coordinator)throw invalid('Không có quyền xem CV.',403,'FORBIDDEN');
  const file=(await c.query(`SELECT "FileName","MimeType","Content" FROM "StudentCVFiles" WHERE "StudentID"=$1 AND ($2::int IS NULL OR "CVFileID"=$2) ORDER BY "CVFileID" DESC LIMIT 1`,[studentId,cvFileId??null])).rows[0];
  if(!file)throw invalid('Sinh viên chưa có CV hoặc file không thuộc sinh viên.',404,'CV_NOT_FOUND');return file;
 });
}
