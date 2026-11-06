import { readTransaction } from '../qhdn/read.repository';
import { studentProfile } from '../students/student-profile.service';
import { ownStudent,type Actor,type Row } from './shared';
import { assessAcademicWarning } from './academic-warning';
import { coursePlanWithClient } from './course-plan.service';
import { OJT_ROADMAP_TARGET_SEMESTER } from './course-plan';

export function buildRiskAndRoadmap(profile:Row,plan:Row|null) {
  const academic=profile.academic;
  const warning=academic?.academicWarning??assessAcademicWarning({available:false,gateReasons:['OJT_SEMESTER_UNAVAILABLE'],
    semester:profile.currentSemester??null,status:'REVIEW_REQUIRED',earnedCredits:profile.academicProgress?.credits?.earned??null,
    missingCredits:null,debt:0,maxDebt:null,overdueCredits:null,overdueCourses:[],blockingCourses:null,
    projectedStatus:null,projectedCredits:null,projectedDebt:null,deadline:null});
  const available=!!academic?.earlyWarning?.available&&warning.level!=='INSUFFICIENT_DATA';
  const status=!available?'NOT_AVAILABLE':plan?.status==='READY'?'READY':'DATA_INCOMPLETE';
  const items=status==='READY'?plan!.items.map((item:Row)=>({...item,stage:item.canPlan?'PRIORITIZE_NOW':'AFTER_PREREQUISITES'})):[];
  return {
    status:available?'ASSESSED':'INSUFFICIENT_DATA',
    student:{id:profile.id,fullName:profile.fullName,studentCode:profile.studentCode,currentSemester:profile.currentSemester??null},
    ojtSemesterId:profile.ojtSemesterId??null,
    risk:{...warning,label:({LOW:'Thấp',MEDIUM:'Trung bình',HIGH:'Cao',INSUFFICIENT_DATA:'Chưa đủ dữ liệu'} as Record<string,string>)[warning.level],
      target:'OJT_READINESS',method:'ACADEMIC_RULES',isAiPrediction:false,riskScore:null},
    roadmap:{status,basedOnRiskLevel:warning.level,targetSemester:OJT_ROADMAP_TARGET_SEMESTER,
      objective:warning.level==='LOW'?'Duy trì tiến độ và chuẩn bị điều kiện OJT.':'Khắc phục các nguyên nhân rủi ro và hoàn thành điều kiện OJT.',
      message:!available?(academic?.earlyWarning?.message??'Chưa đủ dữ liệu hợp lệ để đánh giá rủi ro và đề xuất lộ trình.'):
        plan?.message??'Cần đối soát chương trình và điều kiện tiên quyết trước khi đề xuất môn học.',
      actions:warning.actions,items,
      limitations:['Thứ tự ưu tiên dựa trên chương trình và điều kiện tiên quyết hiện tại; chưa phải lịch đăng ký theo học kỳ.',
        'Cần kiểm tra lịch mở lớp, giới hạn tín chỉ và thời hạn xét với nhà trường.',
        'Các môn trong cùng nhóm lựa chọn là phương án thay thế, không bắt buộc học tất cả và không được cộng tín chỉ nhiều lần.',
        'Đề xuất không thay đổi điểm, đăng ký môn hoặc kết quả xét OJT chính thức.'],
    },
  };
}

export async function assessOjtRisk(actor:Actor) {
  return readTransaction(async c=>{
    const student=await ownStudent(c,actor);
    const profile=await studentProfile(student.StudentID,{include:'academic,academicProgress'},actor,c);
    // Assess first. No personal course roadmap is produced without a valid assessment.
    const canPlan=profile.academic?.earlyWarning?.available&&profile.academic?.academicWarning?.level!=='INSUFFICIENT_DATA';
    const plan=canPlan?await coursePlanWithClient(c,student.StudentID):null;
    return buildRiskAndRoadmap(profile,plan);
  });
}
