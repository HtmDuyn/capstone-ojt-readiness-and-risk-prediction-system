import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { listRecords, resources, type Resource } from './academic.repository';
import { saveResource } from './academic.service';
import { positiveId } from './academic.schema';

const router = Router();
// Scope authentication to these paths so sibling APIs retain their own role rules.
for (const resource of Object.keys(resources) as Resource[]) {
  router.get(`/${resource}`, authenticate, (resource === 'academic-periods' ? authorizeRoles('ADMIN','ACADEMIC','OJT_COORD') : authorizeRoles('ADMIN','ACADEMIC')), async (req,res,next) => {
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
export default router;
