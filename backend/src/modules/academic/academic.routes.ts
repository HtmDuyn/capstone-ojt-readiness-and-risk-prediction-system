import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { listRecords, resources, type Resource } from './academic.repository';
import { assignPlacement, saveResource } from './academic.service';
import { positiveId, inputObject } from './academic.schema';

const router = Router();
// Scope authentication to these paths so sibling APIs retain their own role rules.
for (const resource of Object.keys(resources) as Resource[]) {
  router.get(`/${resource}`, authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
    try { res.json({ success: true, ...await listRecords(resource, req.query as Record<string, unknown>) }); }
    catch (error) { next(error); }
  });
  router.post(`/${resource}`, authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
    try { res.status(201).json({ success: true, data: await saveResource(resource, req.body, req.user!.userId) }); }
    catch (error) { next(error); }
  });
  router.patch(`/${resource}/:id`, authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
    try { res.json({ success: true, data: await saveResource(resource, req.body, req.user!.userId, positiveId(req.params.id)) }); }
    catch (error) { next(error); }
  });
}
router.patch('/students/academic-placement', authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
  try {
    const { studentId, ...placement } = inputObject(req.body, ['studentId','cohortId','groupCode','entryAcademicPeriodId','currentAcademicPeriodId','programId','reason']);
    res.json({ success: true, data: await assignPlacement(positiveId(studentId, 'studentId'), placement, req.user!.userId) });
  } catch (error) { next(error); }
});
router.patch('/students/:id/academic-placement', authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
  try { res.json({ success: true, data: await assignPlacement(positiveId(req.params.id, 'studentId'), req.body, req.user!.userId) }); }
  catch (error) { next(error); }
});
export default router;
