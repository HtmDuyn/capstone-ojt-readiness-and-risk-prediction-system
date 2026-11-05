import { readTransaction } from '../qhdn/read.repository';
import { studentProfile } from '../students/student-profile.service';
import { activeRule } from '../eligibility/eligibility.service';
import { invalid,inputObject,requiredText } from '../students/student.validation';
import { ownStudent,type Actor } from './shared';
import { loadCoursePlanData } from './course-plan.service';
import { buildCoursePlan } from './course-plan';
import { resolvePlanCourse,simulatePassedCourses,courseImpact } from './course-scenario';

export async function courseScenario(body:unknown,actor:Actor,mode:'IMPACT'|'SIMULATION') {
  const b=inputObject(body,mode==='IMPACT'?['courseCode']:['passedCourseCodes']);
  let codes:string[];
  if(mode==='IMPACT')codes=[requiredText(b.courseCode,'courseCode',20).toUpperCase()];
  else {
    if(!Array.isArray(b.passedCourseCodes)||!b.passedCourseCodes.length||b.passedCourseCodes.length>20)throw invalid('passedCourseCodes must contain 1–20 course codes.');
    codes=b.passedCourseCodes.map(v=>requiredText(v,'courseCode',20).toUpperCase());
  }
  return readTransaction(async c=>{
    const student=await ownStudent(c,actor);
    const {data,progress,groups,catalog,valid}=await loadCoursePlanData(c,student.StudentID);
    if(!valid)throw invalid('Review curriculum, credits and prerequisites before using this feature.',409,'ACADEMIC_DATA_INCOMPLETE');
    const selected=codes.map(code=>resolvePlanCourse(code,data,catalog));
    if(new Set(selected.map(s=>s.canonicalCourseId)).size!==selected.length)throw invalid('Duplicate or equivalent course codes are not allowed.');
    if(mode==='IMPACT')return courseImpact(data,groups,catalog,selected[0]);
    const profile=await studentProfile(student.StudentID,{include:'academic'},actor,c);
    if(!profile.academic?.earlyWarning?.available)throw invalid(profile.academic?.earlyWarning?.message??'Academic monitoring is not available.',409,'EARLY_WARNING_NOT_AVAILABLE');
    const semesterId=profile.ojtSemesterId;
    const rule=await activeRule(c,student.ProgramID,semesterId);
    if(!rule)throw invalid('OJT rules need review.',409,'OJT_RULE_NOT_PUBLISHED');
    const currentPlan=buildCoursePlan({requirements:progress.requirements,attempts:data.attempts,groups,aliases:data.aliases,catalog,valid});
    return {...simulatePassedCourses(data,selected,student,semesterId,rule),
      prerequisiteWarnings:selected.flatMap(s=>{const item=currentPlan.items.find(r=>r.courseId===s.canonicalCourseId);
        return item&&!item.canPlan?[{courseCode:s.courseCode,message:'Chưa đủ tiên quyết hiện tại; cần lập thứ tự học trước khi có thể đạt kết quả giả định.',prerequisites:item.prerequisites}]:[];})};
  });
}
