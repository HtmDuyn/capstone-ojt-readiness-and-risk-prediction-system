import { readTransaction } from '../qhdn/read.repository';
import { studentProfile } from '../students/student-profile.service';
import { ownStudent, type Actor } from './shared';
import { coursePlanWithClient } from './course-plan.service';
import { assessAcademicWarning } from './academic-warning';

export async function studentAcademicWarning(actor:Actor) {
  const profile=await readiness(actor);
  return profile.academic?.academicWarning??assessAcademicWarning({available:false,gateReasons:['OJT_SEMESTER_UNAVAILABLE'],
    semester:profile.student.currentSemester??null,status:'REVIEW_REQUIRED',earnedCredits:profile.academicProgress?.credits?.earned??null,
    missingCredits:null,debt:0,maxDebt:null,overdueCredits:null,overdueCourses:[],blockingCourses:null,
    projectedStatus:null,projectedCredits:null,projectedDebt:null,deadline:null});
}

export async function readiness(actor:Actor,includeCoursePlan=false) {
  return readTransaction(async c=>{
    const student=await ownStudent(c,actor);
    const p=await studentProfile(student.StudentID,{include:'academic,academicProgress'},actor,c);
    return {student:{id:p.id,studentCode:p.studentCode,fullName:p.fullName,currentSemester:p.currentSemester,programName:p.program?.name??null},
      ojtSemesterId:p.ojtSemesterId??null,academic:p.academic??null,academicProgress:p.academicProgress??null,
      coursePlan:includeCoursePlan?await coursePlanWithClient(c,student.StudentID):null};
  });
}
