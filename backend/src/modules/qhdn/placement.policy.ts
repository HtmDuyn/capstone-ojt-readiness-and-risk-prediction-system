type StudentState={decision?:string|null;source?:string|null;receivedAt?:unknown;hasAssignment?:boolean;hasConfirmedPlace?:boolean;isActive?:boolean;isFreshEligible?:boolean};
type RecruitmentState={roundCount:number;unfinished:number;applicationDeadlinePassed?:boolean};
export function coordinationAvailability(student:StudentState,context:RecruitmentState){
 let coordinationBlockedReason:string|null=null;
 if(student.isActive===false)coordinationBlockedReason='Sinh viên hoặc tài khoản không còn hoạt động.';
 else if(student.receivedAt||student.hasAssignment||student.hasConfirmedPlace||student.decision==='ACCEPTED')coordinationBlockedReason='Sinh viên đã có nơi thực tập trong kỳ.';
 else if(student.decision==='PENDING'&&student.source?.startsWith('QHDN_'))coordinationBlockedReason='Đang chờ doanh nghiệp phản hồi điều phối trước.';
 else if(student.isFreshEligible&&!student.decision)return {canCoordinate:true,coordinationBlockedReason:null};
 else if(!student.decision&&context.applicationDeadlinePassed)return {canCoordinate:true,coordinationBlockedReason:null};
 else if(student.decision!=='REJECTED'&&(!context.roundCount||context.unfinished))coordinationBlockedReason='Điều phối được khi doanh nghiệp từ chối hoặc sinh viên chưa ứng tuyển đã hết hạn đăng ký. Hồ sơ đang được xử lý phải chờ kết quả tuyển dụng.';
 return {canCoordinate:coordinationBlockedReason===null,coordinationBlockedReason};
}
