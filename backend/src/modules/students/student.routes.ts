import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { positiveId } from './student.validation';
import { assertStudentAccess, listStudents, student, patchStudent, results, patchResult } from './student.service';
import { academicProgress } from './academic-progress';
import { courseResultImport, importHistory, importDetails } from './academic-import.service';

const router=Router();
const staff=[authenticate,authorizeRoles('ADMIN','ACADEMIC')];
const read=[authenticate,authorizeRoles('ADMIN','ACADEMIC','STUDENT')];
const handle=(work:(req:any)=>Promise<unknown>):RequestHandler=>async(req,res,next)=>{try{res.json({success:true,data:await work(req)});}catch(error){next(error);}};
router.get('/students',...staff,handle(req=>listStudents(req.query)));
router.get('/students/:id',...read,handle(async req=>{const id=positiveId(req.params.id);await assertStudentAccess(id,req.user);return student(id);}));
router.patch('/students/:id',...staff,handle(req=>patchStudent(positiveId(req.params.id),req.body,req.user.userId)));
router.get('/students/:id/course-results',...read,handle(async req=>{const id=positiveId(req.params.id);await assertStudentAccess(id,req.user);return results(id,req.query);}));
router.get('/students/:id/academic-progress',...read,handle(async req=>{const id=positiveId(req.params.id);await assertStudentAccess(id,req.user);return academicProgress(id);}));
router.patch('/course-results/:id',...staff,handle(req=>patchResult(positiveId(req.params.id),req.body,req.user.userId)));
for(const mode of ['preview','commit']) router.post(`/course-result-imports/${mode}`,...staff,async(req,res,next)=>{
  try{const data=await courseResultImport(req.body,req.user!.userId,mode==='preview');res.status((data as any).rejectedBatch?422:200).json({success:!(data as any).rejectedBatch,data});}catch(error){next(error);}
});
router.get('/academic-imports',...staff,handle(req=>importHistory(req.query)));
router.get('/academic-imports/:id',...staff,handle(req=>importDetails(req.params.id,req.query)));
export default router;
