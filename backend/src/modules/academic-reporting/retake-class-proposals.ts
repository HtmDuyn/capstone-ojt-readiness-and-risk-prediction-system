import type { Row } from './report.repository';

export const RETAKE_CLASS_POLICY={minimumToPrepare:18,preparationRangeEnd:22,classCapacity:35};
export function planRetakeClasses(count:number){
  if(!Number.isSafeInteger(count)||count<0)throw new Error('Invalid student count');
  const {minimumToPrepare,classCapacity}=RETAKE_CLASS_POLICY;
  const fullClasses=Math.floor(count/classCapacity),remainder=count%classCapacity;
  const prepareExtra=remainder>=minimumToPrepare;
  const proposedClassCount=fullClasses+Number(prepareExtra);
  const waitingStudentCount=prepareExtra?0:remainder;
  return {status:proposedClassCount?'PREPARE_CLASSES':'MONITORING',proposedClassCount,
    fullCapacityClassCount:fullClasses,additionalClassStudentCount:prepareExtra?remainder:0,
    studentsInProposedClasses:count-waitingStudentCount,waitingStudentCount,
    studentsNeededForNextProposal:waitingStudentCount?minimumToPrepare-waitingStudentCount:minimumToPrepare,
    isEarlyPreparation:prepareExtra&&remainder<=RETAKE_CLASS_POLICY.preparationRangeEnd};
}

export function collectRetakeDemand(reports:Row[]){
  const groups=new Map<number,Row>(),excluded=new Set<number>();
  for(const report of reports)for(const student of report.rows){
    if(student.dataIssues.length||student.category==='INSUFFICIENT_DATA'){excluded.add(student.studentId);continue;}
    for(const course of student.missingRequiredCourses){
      // New/unattempted courses and ongoing retakes are not demand for another class.
      if(course.reason!=='RETAKE'||!course.needsEnrollment)continue;
      let group=groups.get(course.courseId);
      if(!group){group={courseId:course.courseId,courseCode:course.courseCode,courseName:course.courseName,studentIds:new Set<number>()};groups.set(course.courseId,group);}
      group.studentIds.add(student.studentId);
    }
  }
  return {items:[...groups.values()].map(g=>({courseId:g.courseId,courseCode:g.courseCode,courseName:g.courseName,
    failedStudentCount:g.studentIds.size,...planRetakeClasses(g.studentIds.size)}))
    .sort((a,b)=>b.proposedClassCount-a.proposedClassCount||b.failedStudentCount-a.failedStudentCount||String(a.courseCode).localeCompare(String(b.courseCode))),
    excludedStudentCount:excluded.size};
}
