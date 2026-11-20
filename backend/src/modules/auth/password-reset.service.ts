import bcrypt from 'bcryptjs';
import { randomBytes } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { invalid } from '../students/student.validation';
import { encryptEmail } from '../imports/email.crypto';
import { wakeEmailAfterCommit } from '../../jobs/email-wakeup';
import { accountEmail } from '../../shared/account-email';

export async function requestPasswordReset(userId:number,actor:number) {
 const password=randomBytes(18).toString('base64url'),hash=await bcrypt.hash(password,12),expiresAt=new Date(Date.now()+24*60*60*1000);
 return academicTransaction(async c=>{
  const u=(await c.query('SELECT u."UserID",u."FullName",u."Username",u."Email",u."Status",r."RoleCode" FROM "Users" u JOIN "Roles" r USING("RoleID") WHERE u."UserID"=$1 FOR UPDATE OF u',[userId])).rows[0];
  if(!u)throw invalid('Account not found.',404);if(u.Status!=='ACTIVE')throw invalid('Only active accounts can reset passwords.',409);
  // Encrypt before any write: missing outbox key must leave the password unchanged.
  const payload=encryptEmail(accountEmail({fullName:u.FullName,email:u.Email,username:u.Username,
    roleCode:u.RoleCode,purpose:'PASSWORD_RESET',temporary:{password,expiresAt}}));
  await c.query(`UPDATE "Users" SET "PasswordHash"=$2,"MustChangePassword"=true,"TemporaryPasswordExpiresAt"=$3,"PasswordChangedAt"=now(),"AuthVersion"="AuthVersion"+1,"UpdatedAt"=now() WHERE "UserID"=$1`,[userId,hash,expiresAt]);
  await c.query(`UPDATE "EmailOutbox" SET "Status"='CANCELLED',"EncryptedPayload"=NULL,"LeaseUntil"=NULL
    WHERE "UserID"=$1 AND "Status"<>'SENT' AND "Kind" IN ('ACCOUNT','PASSWORD_RESET')`,[userId]);
  const email=(await c.query('INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt") VALUES ($1,$2,$3,$4) RETURNING "EmailID"',[userId,u.Email,payload,expiresAt])).rows[0];
  await audit(c,actor,'Users',userId,'REQUEST_PASSWORD_RESET',null,{emailId:email.EmailID,expiresAt});
  return {userId,emailId:email.EmailID,status:'QUEUED',expiresAt};
 }).then(wakeEmailAfterCommit);
}
