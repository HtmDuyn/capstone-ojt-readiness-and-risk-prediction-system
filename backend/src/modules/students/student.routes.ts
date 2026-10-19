import { applyToPosition, listApplications, studentOpportunities } from './job-application.service';
import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from './student.validation';
import { assertStudentAccess, listStudents, patchStudent, results, patchResult } from './student.service';
import { studentProfile } from './student-profile.service';
import { importHistory } from './academic-import.service';
import { listTasks } from '../qhdn/task.service';
import { receiveCV, uploadStudentCV, readCV } from './cv.service';

const router=Router();
router.post('/students/me/cv',authenticate,authorizeRoles('STUDENT'),receiveCV,async(req,res,next)=>{try{
 res.status(201).json({success:true,data:await uploadStudentCV(req.file!,(req as any).user)});
}catch(error){next(error);}});
router.get('/students/:id/cv',authenticate,authorizeRoles('ADMIN','ACADEMIC','OJT_COORD','STUDENT'),async(req,res,next)=>{try{
 const file=await readCV(positiveId(req.params.id),(req as any).user,req.query.cvFileId===undefined?undefined:positiveId(req.query.cvFileId,'cvFileId'));
 res.setHeader('Content-Type',file.MimeType);
 res.setHeader('Content-Disposition',`attachment; filename="cv.pdf"; filename*=UTF-8''${encodeURIComponent(file.FileName).replace(/'/g,'%27')}`);
 res.setHeader('Cache-Control','private, no-store');res.setHeader('X-Content-Type-Options','nosniff');res.send(file.Content);
}catch(error){next(error);}});
const staff=[authenticate,authorizeRoles('ADMIN','ACADEMIC')];
const read=[authenticate,authorizeRoles('ADMIN','ACADEMIC','STUDENT')];
const handle=(work:(req:any)=>Promise<unknown>,status=200):RequestHandler=>async(req,res,next)=>{try{res.status(status).json({success:true,data:await work(req)});}catch(error){next(error);}};
router.post('/job-applications',authenticate,authorizeRoles('STUDENT'),handle(req=>applyToPosition(req.body,req.user),201));
router.get('/job-applications',authenticate,authorizeRoles('ADMIN','OJT_COORD','STUDENT'),handle(req=>listApplications(req.query,req.user)));
router.get('/students/me/opportunities',authenticate,authorizeRoles('STUDENT'),handle(req=>studentOpportunities(req.query,req.user)));
router.get('/students',...staff,handle(req=>listStudents(req.query)));
router.get('/students/:id',...read,handle(req=>studentProfile(positiveId(req.params.id),req.query,req.user)));
router.patch('/students/:id',...staff,handle(req=>patchStudent(positiveId(req.params.id),req.body,req.user.userId)));
router.get('/students/:id/course-results',...read,handle(async req=>{const id=positiveId(req.params.id);await assertStudentAccess(id,req.user);return results(id,req.query);}));
router.patch('/course-results/:id',...staff,handle(req=>patchResult(positiveId(req.params.id),req.body,req.user.userId)));
router.get('/internship-tasks',authenticate,authorizeRoles('STUDENT','ENTERPRISE','OJT_COORD','ADMIN'),handle(req=>listTasks(req.query,req.user)));
router.get('/academic-imports',...staff,handle(req=>importHistory(req.query)));

export default router;
