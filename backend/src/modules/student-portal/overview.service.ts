import type { PoolClient } from 'pg';
import { readTransaction } from '../qhdn/read.repository';
import { listTasks } from '../qhdn/task.service';
import { studentWindows } from '../students/registration-options.service';
import { listApplications } from '../students/job-application.service';
import { list as listResults } from '../ojt-results/result.service';
import { currentAssignment, notifications, summaryWithClient, supplementaryWithClient } from './academic.service';
import { ownStudent, type Actor, type Row } from './shared';
import { pagination, positiveId, invalid, enumValue } from '../students/student.validation';
import { enrichStudentTasks, studentTaskProgress } from './task.service';
import { studentAdmission } from './admission.service';

export async function internships(params:Row,actor:Actor,existingClient?:PoolClient) {
  const allowed=['ojtSemesterId','assignmentId','resultId','tasksPage','tasksLimit','resultsPage','resultsLimit','include'];
  pagination(params,allowed);
  if(params.page!==undefined||params.limit!==undefined)throw invalid('Use tasksPage/tasksLimit and resultsPage/resultsLimit.');
  const term=params.ojtSemesterId===undefined?undefined:positiveId(params.ojtSemesterId,'ojtSemesterId');
  const assignmentId=params.assignmentId===undefined?undefined:positiveId(params.assignmentId,'assignmentId');
  const resultId=params.resultId===undefined?undefined:positiveId(params.resultId,'resultId');
  const include=enumValue(params.include??'all',['all','identity','assignment','tasks','results'],'include');
  if(include==='identity'&&assignmentId)throw invalid('Identity reads do not select an assignment.');
  if(resultId&&include!=='all'&&include!=='results')throw invalid('resultId requires include=results or all.');
  const tasksPage=pagination({page:params.tasksPage,limit:params.tasksLimit},[]);
  const resultsPage=pagination({page:params.resultsPage,limit:params.resultsLimit},[]);
  if([tasksPage,resultsPage].some(p=>p.offset>2147483647))throw invalid('Pagination exceeds allowed range.');
  return readTransaction(async c=>{
    const student=await ownStudent(c,actor);
    if(term&&!(await c.query('SELECT 1 FROM "OJTSemesters" WHERE "OJTSemesterID"=$1',[term])).rowCount)throw invalid('OJT semester not found.',404);
    if(include==='identity')return {studentId:student.StudentID,ojtSemesterId:term??null};
    let selectedTerm=term;
    if(assignmentId){
      const selected=(await c.query(`SELECT co."OJTSemesterID" AS id FROM "InternshipAssignments" a
        JOIN "StudentEnterpriseCoordination" co ON co."CoordinationID"=a."CoordinationID"
        WHERE a."AssignmentID"=$1 AND a."StudentID"=$2`,[assignmentId,student.StudentID])).rows[0];
      if(!selected||(term&&term!==selected.id))throw invalid('Assignment not found.',404);
      selectedTerm=selected.id;
    }
    let result:Row|null=null;
    if(resultId){
      const selected=await listResults({resultId,ojtSemesterId:selectedTerm},undefined,false,actor.userId,c);
      result=selected.items[0]??null;
      if(!result||(assignmentId&&result.assignmentId!==assignmentId))throw invalid('Published result not found.',404);
      selectedTerm=result.ojtSemesterId;
    }
    const output:Row={studentId:student.StudentID,ojtSemesterId:selectedTerm??null};
    if(include==='all'||include==='results'){
      output.result=result;
      // A detail lookup already selected its one visible result; do not load the list as well.
      if(include==='all'||!resultId)output.results=await listResults({ojtSemesterId:selectedTerm,page:resultsPage.page,limit:resultsPage.limit},undefined,false,actor.userId,c);
    }
    if(include==='results')return output;
    const assignment=await currentAssignment({ojtSemesterId:selectedTerm,assignmentId:assignmentId??result?.assignmentId},actor,c);
    output.assignment=assignment;
    if(include==='assignment')return output;
    const tasks=assignment?await listTasks({studentId:student.StudentID,assignmentId:assignment.id,page:tasksPage.page,limit:tasksPage.limit},actor,c)
      :{items:[],total:0,page:tasksPage.page,limit:tasksPage.limit};
    output.tasks={...tasks,items:await enrichStudentTasks(c,tasks.items,student.StudentID),
      progress:await studentTaskProgress(c,assignment?.id??null,student.StudentID)};
    return output;
  },existingClient);
}

export async function dashboard(params:Row,actor:Actor) {
  for(const key of Object.keys(params))if(!['ojtSemesterId','view'].includes(key))throw invalid('Unknown dashboard parameter: '+key);
  const term=positiveId(params.ojtSemesterId,'ojtSemesterId');
  const view=enumValue(params.view??'full',['full','overview'],'view');
  return readTransaction(async c=>{
    const s=await ownStudent(c,actor);
    const academic=await summaryWithClient(c,s.StudentID,term);
    if(view==='overview')return {
      academic:{...academic,admissionEligibility:await studentAdmission(c,s.StudentID,term,{official:academic.officialEligibility})},
      registrationWindows:await studentWindows('ojt',{ojtSemesterId:term,limit:5},actor,c),
      internship:{assignment:await currentAssignment({ojtSemesterId:term},actor,c)},
      notifications:await notifications({limit:1},actor,c),
    };
    const supplementary=await supplementaryWithClient(c,s.StudentID,s.ProgramID,academic);
    return {
      academic:{...academic,supplementaryCourses:supplementary,
        admissionEligibility:await studentAdmission(c,s.StudentID,term,{official:academic.officialEligibility})},
      registrationWindows:await studentWindows('ojt',{ojtSemesterId:term,limit:5},actor,c),
      comboWindows:await studentWindows('combo',{limit:5},actor,c),
      internship:await internships({ojtSemesterId:term,tasksLimit:5,resultsLimit:5},actor,c),
      notifications:await notifications({limit:5},actor,c),
      jobApplications:await listApplications({ojtSemesterId:term,limit:5},actor,c),
    };
  });
}
