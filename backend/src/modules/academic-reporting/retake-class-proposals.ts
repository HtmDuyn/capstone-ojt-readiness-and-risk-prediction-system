import type { Row } from './report.repository';

export const RETAKE_CLASS_POLICY={classCapacity:35};
export function planRetakeClasses(count:number){
  if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid student count');
  const proposedClassCount=count===0?0:count<=RETAKE_CLASS_POLICY.classCapacity?1:2;
  return {status:proposedClassCount?'PREPARE_CLASSES':'MONITORING',proposedClassCount,
    fullCapacityClassCount:proposedClassCount,additionalClassStudentCount:0,
    studentsInProposedClasses:count,waitingStudentCount:0,
    studentsNeededForNextProposal:0,isEarlyPreparation:false};
}

export function collectRetakeDemand(reports:Row[]){
  const groups=new Map<number,Row>(),excluded=new Set<number>();
  for(const report of reports)for(const student of report.rows){
    // Retake demand needs valid course/pathway data, not an OJT eligibility
    // rule or official eligibility confirmation. Those may be absent even
    // when the student's failed courses are fully reconciled.
    if(student.dataIssues.length){excluded.add(student.studentId);continue;}
    for(const course of student.missingRequiredCourses){
      // Include failed courses that need a retake, plus unattempted courses
      // scheduled in curriculum semester 5. Other not-yet-completed courses
      // are outside this proposal's scope.
      const failedRetake=course.reason==='RETAKE';
      const unattemptedSemesterFive=course.reason==='NOT_COMPLETED'&&course.recommendedSemester===5;
      if((!failedRetake&&!unattemptedSemesterFive)||!course.needsEnrollment)continue;
      let group=groups.get(course.courseId);
      if(!group){group={courseId:course.courseId,courseCode:course.courseCode,courseName:course.courseName,studentIds:new Set<number>()};groups.set(course.courseId,group);}
      group.studentIds.add(student.studentId);
    }
  }
  return {items:[...groups.values()].map(g=>({courseId:g.courseId,courseCode:g.courseCode,courseName:g.courseName,
    demandStudentCount:g.studentIds.size,...planRetakeClasses(g.studentIds.size)}))
    .sort((a,b)=>b.proposedClassCount-a.proposedClassCount||b.demandStudentCount-a.demandStudentCount||String(a.courseCode).localeCompare(String(b.courseCode))),
    excludedStudentCount:excluded.size};
}
