import { createHash } from 'node:crypto';
import { academicTransaction, audit } from '../academic/academic.repository';
import { encryptEmail } from '../imports/email.crypto';
import { inputObject, requiredText, ids, enumValue, invalid } from './combo.validation';
import { windowRecord, roster } from './combo.repository';
import { assertRosterContext } from './selection.service';
import { now } from './window.service';

export async function sendReminders(id:number,body:unknown,actorId:number) {
  const b=inputObject(body,['idempotencyKey','studentIds','target','reason']);
  const key=requiredText(b.idempotencyKey,'idempotencyKey',100),target=enumValue(b.target??'MISSING',['MISSING','ALL'],'target'),studentIds=b.studentIds===undefined?null:ids(b.studentIds,'studentIds'),reason=requiredText(b.reason,'reason',2000);
  if(studentIds&&!studentIds.length)throw invalid('studentIds must be nonempty when supplied.');
  const hash=createHash('sha256').update(JSON.stringify({target,studentIds,reason})).digest('hex');
  return academicTransaction(async client=>{
    const w=await windowRecord(client,id,true),old=(await client.query('SELECT * FROM "ComboReminderBatches" WHERE "WindowID"=$1 AND "IdempotencyKey"=$2',[id,key])).rows[0];
    if(old){if(old.PayloadHash!==hash||old.CreatedBy!==actorId)throw invalid('Reminder key belongs to another request.',409,'REMINDER_CONFLICT');return {...old.Summary,batchId:old.BatchID,replayed:true};}
    if(w.Status!=='OPEN')throw invalid('Reminders require an open window.',409);
    const time=await now(client),all=await roster(client,id);
    if(studentIds&&studentIds.some(id=>!all.some(r=>r.studentId===id)))throw invalid('Some reminder recipients are outside this window’s frozen scope.');
    const requested=studentIds?all.filter(r=>studentIds.includes(r.studentId)):all;
    const recipients=requested.filter(r=>r.studentStatus==='ACTIVE'&&r.accountStatus==='ACTIVE'&&new Date(r.effectiveEndsAt)>time&&(target==='ALL'||!r.eventId));
    const summary={windowId:id,target,requested:requested.length,queued:recipients.length,skipped:requested.length-recipients.length};
    const batchId=(await client.query(`INSERT INTO "ComboReminderBatches" ("WindowID","IdempotencyKey","PayloadHash","CreatedBy","Summary") VALUES ($1,$2,$3,$4,$5) RETURNING "BatchID"`,[id,key,hash,actorId,JSON.stringify(summary)])).rows[0].BatchID;
    for(const r of recipients) {
      await assertRosterContext(client,r);
      const deadline=new Date(r.effectiveEndsAt).toISOString();
      const title=w.Phase==='INITIAL'?'Nhắc chọn combo chuyên ngành':'Nhắc xác nhận combo chuyên ngành';
      const text=`Xin chào ${r.fullName},\nĐợt: ${w.Name}.\nVui lòng ${w.Phase==='INITIAL'?'chọn':'xác nhận'} combo chuyên ngành trước ${deadline}.\nĐăng nhập: ${process.env.FRONTEND_LOGIN_URL??''}\nMã sinh viên: ${r.studentCode}.`;
      const notificationId=(await client.query(`INSERT INTO "Notifications" ("UserID","Title","Content","Channel","RelatedEntityType","RelatedEntityID","SentAt") VALUES ($1,$2,$3,'IN_APP','COMBO_WINDOW',$4,now()) RETURNING "NotificationID"`,[r.userId,title,text,id])).rows[0].NotificationID;
      const emailId=(await client.query(`INSERT INTO "EmailOutbox" ("UserID","Recipient","EncryptedPayload","ExpiresAt","Kind") VALUES ($1,$2,$3,$4,'COMBO_REMINDER') RETURNING "EmailID"`,[r.userId,r.email,encryptEmail({subject:title,text}),r.effectiveEndsAt])).rows[0].EmailID;
      await client.query(`INSERT INTO "ComboReminderDeliveries" ("BatchID","WindowID","StudentID","NotificationID","EmailID") VALUES ($1,$2,$3,$4,$5)`,[batchId,id,r.studentId,notificationId,emailId]);
    }
    await audit(client,actorId,'ComboRegistrationWindows',id,'QUEUE_COMBO_REMINDERS',null,{...summary,batchId,studentIds:recipients.map(r=>r.studentId)},reason);
    return {...summary,batchId,replayed:false};
  });
}
