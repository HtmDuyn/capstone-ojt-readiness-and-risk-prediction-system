type StudentState={decision?:string|null;source?:string|null;receivedAt?:unknown;hasAssignment?:boolean;hasConfirmedPlace?:boolean;isActive?:boolean};
type RecruitmentState={roundCount:number;unfinished:number};
export function coordinationAvailability(student:StudentState,context:RecruitmentState){
 let coordinationBlockedReason:string|null=null;
 if(student.isActive===false)coordinationBlockedReason='Sinh viên hoặc tài khoản không còn hoạt động.';
 else if(student.receivedAt||student.hasAssignment||student.hasConfirmedPlace||student.decision==='ACCEPTED')coordinationBlockedReason='Sinh viên đã có nơi thực tập trong kỳ.';
 else if(student.decision==='PENDING'&&student.source?.startsWith('QHDN_'))coordinationBlockedReason='Đang chờ doanh nghiệp phản hồi điều phối trước.';
 else if(student.decision!=='REJECTED'&&(!context.roundCount||context.unfinished))coordinationBlockedReason='Có thể điều phối ngay khi doanh nghiệp từ chối. Các hồ sơ khác được xử lý sau khi chốt tổng hợp tuyển dụng.';
 return {canCoordinate:coordinationBlockedReason===null,coordinationBlockedReason};
}
