import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId, enumValue, invalid } from '../students/student.validation';
import { student } from '../students/student.service';
import { catalogs, detail, listCatalog, csv } from './admin.repository';
import { saveCompany, savePosition, softDelete, semesterDetail, saveTemplate, publishTemplate } from './catalog.service';
import { createStudent, deleteStudent, exportStudents } from './student-admin.service';
import { assignments, assignmentDetail, saveAssignment } from './assignment.service';
import { createPredictionJob, predictionJob, predictions, predictionDetail } from './prediction.service';
import { alerts, alertDetail, changeAlert, interventions, saveIntervention, assessments, assessmentDetail, auditLogs } from './monitoring.service';
import { dashboardSummary, distribution, trends, predictionReport } from './reporting.service';

const router=Router();
const admin=[authenticate,authorizeRoles('ADMIN')];
const handle=(work:(req:any)=>Promise<unknown>,status=200):RequestHandler=>async(req,res,next)=>{
 try{const data=await work(req);if(status===204){res.status(204).end();return;}res.status(status).json({success:true,data});}catch(error){next(error);}
};
router.get('/admin/dashboard/summary',...admin,handle(r=>dashboardSummary(r.query)));
router.get('/admin/dashboard/readiness',...admin,handle(r=>distribution('readiness',r.query)));
router.get('/admin/dashboard/risks',...admin,handle(r=>distribution('risks',r.query)));
router.get('/admin/dashboard/trends',...admin,handle(r=>trends(r.query)));
router.post('/students',...admin,handle(r=>createStudent(r.body,r.user.userId),201));
// Must be mounted before existing /students/:id.
router.get('/students/export',...admin,async(req,res,next)=>{try{const rows=await exportStudents(req.query);res.attachment('students.csv').type('text/csv; charset=utf-8').send(csv(rows,['id','studentCode','fullName','email','programId','cohortId','groupCode','className','status']));}catch(error){next(error);}});
router.delete('/students/:id',...admin,handle(r=>deleteStudent(positiveId(r.params.id),r.user.userId),204));
router.get('/companies',...admin,handle(r=>listCatalog(catalogs.companies,r.query)));
router.get('/companies/:id',...admin,handle(r=>detail(catalogs.companies,positiveId(r.params.id))));
router.post('/companies',...admin,handle(r=>saveCompany(r.body,r.user.userId),201));
router.patch('/companies/:id',...admin,handle(r=>saveCompany(r.body,r.user.userId,positiveId(r.params.id))));
router.delete('/companies/:id',...admin,handle(r=>softDelete('companies',positiveId(r.params.id),r.user.userId),204));
router.get('/positions',...admin,handle(r=>listCatalog(catalogs.positions,r.query)));
router.post('/positions',...admin,handle(r=>savePosition(r.body,r.user.userId),201));
router.patch('/positions/:id',...admin,handle(r=>savePosition(r.body,r.user.userId,positiveId(r.params.id))));
router.delete('/positions/:id',...admin,handle(r=>softDelete('positions',positiveId(r.params.id),r.user.userId),204));
router.get('/ojt-semesters/:id',...admin,handle(r=>semesterDetail(positiveId(r.params.id))));
router.get('/assignments',...admin,handle(r=>assignments(r.query)));
router.get('/assignments/:id',...admin,handle(r=>assignmentDetail(positiveId(r.params.id))));
router.post('/assignments',...admin,handle(r=>saveAssignment(r.body,r.user.userId),201));
router.patch('/assignments/:id',...admin,handle(r=>saveAssignment(r.body,r.user.userId,positiveId(r.params.id))));
router.patch('/assignments/:id/status',...admin,handle(r=>saveAssignment(r.body,r.user.userId,positiveId(r.params.id),true)));
router.get('/assessment-templates',...admin,handle(r=>listCatalog(catalogs.templates,r.query)));
router.get('/assessment-templates/:id',...admin,handle(r=>detail(catalogs.templates,positiveId(r.params.id))));
router.post('/assessment-templates',...admin,handle(r=>saveTemplate(r.body,r.user.userId),201));
router.patch('/assessment-templates/:id',...admin,handle(r=>saveTemplate(r.body,r.user.userId,positiveId(r.params.id))));
router.post('/assessment-templates/:id/publish',...admin,handle(r=>publishTemplate(positiveId(r.params.id),r.user.userId)));
router.get('/assessments',...admin,handle(r=>assessments(r.query)));
router.get('/assessments/:id',...admin,handle(r=>assessmentDetail(positiveId(r.params.id))));
router.post('/admin/prediction-jobs',...admin,handle(r=>createPredictionJob(r.body,r.user.userId),202));
router.get('/admin/prediction-jobs/:id',...admin,handle(r=>predictionJob(positiveId(r.params.id),r.query)));
router.get('/predictions',...admin,handle(r=>predictions(r.query)));
router.get('/predictions/:id',...admin,handle(r=>predictionDetail(positiveId(r.params.id))));
router.get('/students/:id/predictions',...admin,handle(async r=>{const id=positiveId(r.params.id);await student(id);if(r.query.studentId!==undefined)throw invalid('studentId is supplied in the path.');return predictions({...r.query,studentId:id});}));
router.get('/admin/models',...admin,handle(r=>listCatalog(catalogs.models,r.query)));
router.get('/admin/models/:id',...admin,handle(r=>detail(catalogs.models,positiveId(r.params.id))));
router.get('/alerts',...admin,handle(r=>alerts(r.query)));
router.get('/alerts/:id',...admin,handle(r=>alertDetail(positiveId(r.params.id))));
router.patch('/alerts/:id/status',...admin,handle(r=>changeAlert(positiveId(r.params.id),r.body,r.user.userId)));
router.post('/alerts/:id/interventions',...admin,handle(r=>saveIntervention(positiveId(r.params.id),r.body,r.user.userId),201));
router.get('/students/:id/interventions',...admin,handle(async r=>{const id=positiveId(r.params.id);await student(id);return interventions(id,r.query);}));
router.patch('/interventions/:id',...admin,handle(r=>saveIntervention(null,r.body,r.user.userId,positiveId(r.params.id))));
router.get('/admin/reports/readiness',...admin,handle(r=>predictionReport(r.query)));
router.get('/admin/reports/risks',...admin,handle(r=>predictionReport(r.query)));
router.get('/admin/reports/export',...admin,async(req,res,next)=>{
 try{const type=enumValue(req.query.type,['readiness','risks'],'type'),format=enumValue(req.query.format??'csv',['csv','json'],'format');const data=await predictionReport(req.query,true);
  if(format==='json'){res.json({success:true,data});return;}
  const keys=['studentId','studentCode','fullName','ojtSemesterId','modelId',...(type==='readiness'?['readinessScore','readinessLevel']:['riskScore','riskLevel']),'createdAt'];
  res.attachment(`${type}-report.csv`).type('text/csv; charset=utf-8').send(csv(data.items??[],keys));
 }catch(error){next(error);}
});
router.get('/admin/audit-logs',...admin,handle(r=>auditLogs(r.query)));
export default router;
