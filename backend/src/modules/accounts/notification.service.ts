import { query } from '../../config/database';
import { pagination, inputObject, invalid } from '../students/student.validation';
export async function accountNotifications(params:Record<string,unknown>,userId:number){
 const p=pagination(params,[]);
 const [items,counts]=await Promise.all([
  query(`SELECT "NotificationID" AS id,"Title" AS title,"Content" AS content,"IsRead" AS "isRead","SentAt" AS "sentAt" FROM "Notifications" WHERE "UserID"=$1 ORDER BY "SentAt" DESC,"NotificationID" DESC LIMIT $2 OFFSET $3`,[userId,p.limit,p.offset]),
  query(`SELECT count(*)::int AS total,count(*) FILTER(WHERE NOT "IsRead")::int AS "unreadCount" FROM "Notifications" WHERE "UserID"=$1`,[userId]),
 ]);
 return {items:items.rows,...counts.rows[0],page:p.page,limit:p.limit};
}
export async function readAccountNotification(id:number,body:unknown,userId:number){
 const b=inputObject(body,['isRead']);if(b.isRead!==true)throw invalid('isRead must be true.');
 const result=await query(`UPDATE "Notifications" SET "IsRead"=true WHERE "NotificationID"=$1 AND "UserID"=$2 RETURNING "NotificationID" AS id,"IsRead" AS "isRead"`,[id,userId]);
 if(!result.rowCount)throw invalid('Không tìm thấy thông báo.',404,'NOTIFICATION_NOT_FOUND');
 return result.rows[0];
}
