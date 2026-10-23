import { Router,type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { inputObject,positiveId,pagination } from '../students/student.validation';
import { assessmentWindows,createAssessment,updateAssessment,updateRule,semesters,semesterDossier,createNotification,notifications } from './rest-resource.service';
import { createImportRequest,commitImportRequest,importRequests,retryStudentImportEmail } from '../imports/import-request.service';
import { saveGradeMapping } from './workflow-policy';
import { handoff,handoffHistory } from '../ojt-registration/handoff.service';
import { listWindows,asWindow,windowRecord } from '../combo-registration/combo.repository';
import { selectionReport } from '../combo-registration/window.service';
import { academicTransaction } from './academic.repository';
import { alerts,courseDemand,csvReport } from '../academic-reporting/report-read.service';
import { enumValue } from '../students/student.validation';
const router=Router(),staff=[authenticate,authorizeRoles('ADMIN','ACADEMIC')];
const handle=(fn:(req:any)=>Promise<unknown>,status=200):RequestHandler=>async(req,res,next)=>{try{res.status(status).json({success:true,data:await fn(req)});}catch(error){next(error);}};
router.get('/assessment-windows',...staff,handle(r=>assessmentWindows(r.query)));
router.post('/assessment-windows',...staff,handle(r=>createAssessment(r.body,r.user),201));
router.patch('/assessment-windows',...staff,handle(r=>updateAssessment(r.body,r.user)));
router.patch('/ojt-rule-sets',...staff,handle(r=>updateRule(r.body,r.user)));
router.get('/ojt-semesters',...staff,handle(r=>semesters(r.query)));
router.get('/ojt-semesters/:id',...staff,handle(r=>semesterDossier(positiveId(r.params.id),r.query,r.user)));
router.put('/ojt-grade-mappings',...staff,handle(r=>{
  const b=inputObject(r.body,['programId','ojtSemesterId','courseId','academicPeriodId','gradeBands','reason']),{programId,ojtSemesterId,...mapping}=b;
  return saveGradeMapping(positiveId(programId,'programId'),positiveId(ojtSemesterId,'ojtSemesterId'),mapping,r.user.userId);
}));
router.get('/eligible-student-handoffs',...staff,handle(r=>{const {ojtSemesterId,...params}=r.query;return handoffHistory(ojtSemesterId===undefined?null:positiveId(ojtSemesterId,'ojtSemesterId'),params);}));
router.post('/eligible-student-handoffs',...staff,handle(r=>{
  const b=inputObject(r.body,['ojtSemesterId','studentIds','idempotencyKey','reason']),{ojtSemesterId,...input}=b;
  return handoff(positiveId(ojtSemesterId,'ojtSemesterId'),input,r.user.userId);
},201));
router.get('/academic-notifications',...staff,handle(r=>notifications(r.query,r.user)));
router.get('/academic-notifications/:id',...staff,handle(r=>notifications(r.query,r.user,String(r.params.id))));
router.post('/academic-notifications',...staff,handle(r=>createNotification(r.body,r.user),202));
for(const [path,kind]of [['student-imports','STUDENT'],['curriculum-imports','CURRICULUM']] as const){
  router.get('/'+path,...staff,handle(r=>importRequests(kind,r.query,r.user)));
  router.get('/'+path+'/:id',...staff,handle(r=>importRequests(kind,r.query,r.user,positiveId(r.params.id))));
  router.post('/'+path,...staff,handle(r=>createImportRequest(kind,r.body,r.user),201));
  router.patch('/'+path,...staff,handle(r=>commitImportRequest(kind,r.body,r.user)));
}
router.post('/student-imports/:id/email-retries',authenticate,authorizeRoles('ADMIN'),handle(r=>retryStudentImportEmail(positiveId(r.params.id),r.body,r.user),202));
router.get('/academic-alerts',...staff,handle(r=>alerts(r.query)));
router.get('/course-demands',...staff,handle(r=>courseDemand(r.query)));
router.get('/course-demands/export',...staff,async(req,res,next)=>{try{
  const format=enumValue(req.query.format??'csv',['csv','json'],'format'),data=await courseDemand(req.query,true);
  if(format==='json'){res.json({success:true,data});return;}
  res.setHeader('Content-Disposition','attachment; filename="academic-course-demand.csv"');res.type('text/csv; charset=utf-8').send(csvReport(data));
}catch(error){next(error);}});
router.get('/combo-registration-windows/:id',...staff,handle(async r=>{
  pagination(r.query,['outcome']);const id=positiveId(r.params.id);
  const window=await academicTransaction(async c=>asWindow(await windowRecord(c,id)));
  return {...window,selections:await selectionReport(id,r.query)};
}));
export default router;
