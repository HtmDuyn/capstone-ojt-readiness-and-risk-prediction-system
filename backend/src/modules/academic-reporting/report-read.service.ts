import { enrichListRows } from '../../shared/list-context';
import { academicTransaction } from '../academic/academic.repository';
import { invalid,positiveId,pagination,enumValue } from '../students/student.validation';
import { scopeKeys,type Row } from './report.repository';
import { demandRows } from './report-format';
import { readReports } from './read-scope';
export { csvReport } from './report-format';

const publicStudent=(r:Row)=>({studentId:r.studentId,studentCode:r.studentCode,fullName:r.fullName,programId:r.programId,cohortId:r.cohortId,groupCode:r.groupCode,majorId:r.majorId,comboIds:r.comboIds,category:r.category,officialCheckId:r.officialCheckId,officialStale:r.officialStale,evaluation:r.evaluation,missingRequiredCourses:r.missingRequiredCourses,alternativeRequirements:r.alternativeRequirements,dataIssues:r.dataIssues,alertTypes:r.alertTypes});
const deadlineStatus=(deadline:unknown,now:string)=>deadline==null?'NOT_CONFIGURED':new Date(String(deadline))>new Date(now)?'UPCOMING':'OVERDUE';

export async function alerts(params:Row) {
  const p=pagination(params,[...scopeKeys,'type']);
  const type=params.type===undefined?null:enumValue(params.type,['CREDIT_SHORTFALL','MISSING_REQUIRED_COURSES','EXCESS_FAILED_COURSES'],'type');
  return academicTransaction(async c=>{
    const {requested,scopes,data}=await readReports(c,params,['type']),computedAt=new Date().toISOString();
    const all=data.flatMap(d=>d.rows.filter((r:Row)=>r.alertTypes.length&&(!type||r.alertTypes.includes(type))).map((r:Row)=>({...publicStudent(r),
      ojtSemesterId:d.scope.ojtSemesterId,academicPeriodId:d.scope.academicPeriodId,
      assessmentDeadline:d.scope.assessmentDeadline,deadlineStatus:deadlineStatus(d.scope.assessmentDeadline,computedAt)})));
    return {scope:requested,scopes,total:all.length,page:p.page,limit:p.limit,items:await enrichListRows(c,all.slice(p.offset,p.offset+p.limit)),
      deadlineStatus:scopes.length===1?deadlineStatus(scopes[0].assessmentDeadline,computedAt):scopes.length?'PER_SEMESTER':'NOT_CONFIGURED',
      studentsWithDataIssues:data.reduce((n,d)=>n+d.rows.filter((r:Row)=>r.dataIssues.length).length,0),computedAt};
  });
}

export async function courseDemand(params:Row,exporting=false) {
  const p=pagination(params,[...scopeKeys,'includeInProgress','courseId','format']);
  const courseId=params.courseId===undefined?null:positiveId(params.courseId,'courseId');
  if(params.includeInProgress!==undefined&&!['true','false'].includes(params.includeInProgress))throw invalid('includeInProgress must be true or false.');
  const withProgress=params.includeInProgress==='true';
  if(!exporting&&params.format!==undefined)throw invalid('format is only supported for export.');
  return academicTransaction(async c=>{
    const {requested,scopes,data}=await readReports(c,params,['includeInProgress','courseId','format']);
    if(courseId&&!(await c.query('SELECT 1 FROM "Courses" WHERE "CourseID"=$1',[courseId])).rowCount)throw invalid('Course not found.',404);
    const details=data.flatMap(d=>d.period?demandRows(d,withProgress):[]).filter(r=>!courseId||r.courseId===courseId);
    const byCourse=new Map<string,Row>();
    for(const r of details){
      const key=`${r.ojtSemesterId}:${r.academicPeriodId}:${r.courseId}`;
      let group=byCourse.get(key);
      if(!group){group={courseId:r.courseId,courseCode:r.courseCode,courseName:r.courseName,ojtSemesterId:r.ojtSemesterId,academicPeriodId:r.academicPeriodId,periodCode:r.periodCode,periodKind:r.periodKind,students:new Map()};byCourse.set(key,group);}
      group.students.set(r.studentId,r);
    }
    const groups=[...byCourse.values()].sort((a,b)=>a.courseCode.localeCompare(b.courseCode)||a.ojtSemesterId-b.ojtSemesterId).map(g=>{
      const students:Row[]=[...g.students.values()];
      return {...g,students,studentCount:students.length,retakeCount:students.filter(r=>r.reason==='RETAKE').length,inProgressCount:students.filter(r=>r.reason==='IN_PROGRESS').length};
    });
    const metadata={scope:requested,scopes,includeInProgress:withProgress,
      studentsWithDataIssues:await enrichListRows(c,data.flatMap(d=>d.rows.filter((r:Row)=>r.dataIssues.length).map((r:Row)=>({studentId:r.studentId,studentCode:r.studentCode,fullName:r.fullName,ojtSemesterId:d.scope.ojtSemesterId,issues:r.dataIssues})))),
      unresolvedAlternatives:await enrichListRows(c,data.flatMap(d=>d.rows.filter((r:Row)=>r.alternativeRequirements.length).map((r:Row)=>({studentId:r.studentId,studentCode:r.studentCode,fullName:r.fullName,ojtSemesterId:d.scope.ojtSemesterId,requirements:r.alternativeRequirements})))),computedAt:new Date().toISOString()};
    if(exporting){
      const unique=[...new Map(details.map(r=>[`${r.ojtSemesterId}:${r.academicPeriodId}:${r.studentId}:${r.courseId}`,r])).values()];
      if(unique.length>100000)throw invalid('Narrow export scope to at most 100000 student-course rows.',422);
      return {...metadata,total:unique.length,items:await enrichListRows(c,unique)};
    }
    return {...metadata,total:groups.length,page:p.page,limit:p.limit,items:await enrichListRows(c,groups.slice(p.offset,p.offset+p.limit))};
  });
}
