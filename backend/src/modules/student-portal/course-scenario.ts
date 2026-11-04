import { progressFromData, type AcademicProgressData } from '../students/academic-progress';
import { evaluateEligibility } from '../eligibility/eligibility.service';
import { invalid } from '../students/student.validation';
import { buildCoursePlan } from './course-plan';
import type { Row } from './shared';

export function canonicalCourse(id:number,aliases:Row[]) {
  const mapping=new Map<number,number>(aliases.map(a=>[a.SourceCourseID,a.TargetCourseID]));
  const seen=new Set<number>();
  while(mapping.has(id)){if(seen.has(id))throw invalid('Course equivalence needs review.',409);seen.add(id);id=mapping.get(id)!;}
  return id;
}

export function resolvePlanCourse(code:string,data:AcademicProgressData,catalog:Row[]):Row & {canonicalCourseId:number} {
  const course=catalog.find(r=>r.courseCode?.toUpperCase()===code);
  if(!course)throw invalid(`Course ${code} is not in your assigned curriculum or confirmed choices.`,400,'COURSE_OUTSIDE_CURRICULUM');
  const id=canonicalCourse(course.courseId,data.aliases);
  if(!progressFromData(data).requirements.some(r=>r.choices.includes(id)))throw invalid(`Course ${code} is not in your assigned curriculum or confirmed choices.`,400,'COURSE_OUTSIDE_CURRICULUM');
  return {...course,canonicalCourseId:id};
}

export function simulatePassedCourses(data:AcademicProgressData,selected:Row[],student:Row,semesterId:number,rule:Row) {
  const base=progressFromData(data);
  const additions=selected.map((s,index)=>({courseId:s.canonicalCourseId,courseCode:s.courseCode,status:'RECOGNIZED',id:-(index+1),attemptNumber:1}));
  const scenario={...data,attempts:[...data.attempts,...additions]};
  const projected=progressFromData(scenario);
  const evaluate=(progress:Row,attempts:Row[])=>evaluateEligibility({student,semester:{OJTSemesterID:semesterId},rule,progress,attempts,aliases:data.aliases});
  const before=evaluate(base,data.attempts),after=evaluate(projected,scenario.attempts);
  const summary=(r:Row)=>({earnedCredits:r.earnedCredits,missingCredits:r.missingCredits,failedCourseCount:r.unpassedCourseCount,
    eligibilityStatus:r.status,reasons:r.reasons});
  return {isSimulation:true,isAiPrediction:false,assumption:'SELECTED_COURSES_PASSED',
    before:summary(before),after:summary(after),
    change:{earnedCredits:Math.round((after.earnedCredits-before.earnedCredits)*100)/100,
      failedCourseCount:after.unpassedCourseCount-before.unpassedCourseCount},
    selectedCourses:selected.map(s=>({...s,alreadyPassed:data.attempts.some(a=>canonicalCourse(a.courseId,data.aliases)===s.canonicalCourseId&&['PASSED','RECOGNIZED'].includes(a.status))})),
    message:'Đây là giả định các môn đã chọn đều đạt, không phải dự báo hoặc kết quả chính thức. Không ghi điểm vào DB, không mô phỏng GPA hay cam kết học các môn trong cùng kỳ.'};
}

export function courseImpact(data:AcademicProgressData,groups:Row[],catalog:Row[],selected:Row) {
  const id=selected.canonicalCourseId;
  // Remove only the selected achievement to answer the explicit what-if, even if already passed.
  const hypothetical={...data,attempts:data.attempts.filter(a=>canonicalCourse(a.courseId,data.aliases)!==id)};
  const progress=progressFromData(hypothetical);
  const plan=buildCoursePlan({requirements:progress.requirements,attempts:hypothetical.attempts,groups,aliases:data.aliases,catalog,valid:true});
  const item=plan.items.find(r=>r.courseId===id);
  return {course:selected,isSimulation:true,assumption:'SELECTED_COURSE_NOT_PASSED',
    alreadyPassed:data.attempts.some(a=>canonicalCourse(a.courseId,data.aliases)===id&&['PASSED','RECOGNIZED'].includes(a.status)),
    dependentCourses:item?.dependentCourses??[],indirectCourses:item?.downstreamCourses.filter(r=>!item.dependentCourses.some(d=>d.courseId===r.courseId))??[],downstreamCount:item?.downstreamCount??0,
    prerequisites:item?.prerequisites??[],
    explanation:item?.dependentCourses.length?`Nếu chưa đạt ${selected.courseCode}, môn này vẫn là điều kiện tiên quyết chưa hoàn thành của ${item.dependentCourses.map(r=>r.courseCode??r.courseId).join(', ')}.`
      :`Chưa tìm thấy môn chưa hoàn thành nào bị chặn trực tiếp bởi ${selected.courseCode} trong các quy tắc tiên quyết đã cấu hình.`,
    message:'Chỉ xét môn thuộc chương trình/lựa chọn đã xác nhận và chưa hoàn thành. Nhóm lựa chọn không có nghĩa mọi môn thành viên đều bắt buộc. Không sửa dữ liệu học tập.'};
}
