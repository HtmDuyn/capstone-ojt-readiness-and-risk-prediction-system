import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { listRecords, resources, type Resource } from './academic.repository';
import { saveResource } from './academic.service';
import { positiveId } from './academic.schema';
import { savePeriodResource } from './period-resource.service';
import { createYearCalendar, getYearCalendar, updateYearCalendar } from './calendar.service';

const router = Router();
const calendarStaff = [authenticate, authorizeRoles('ADMIN','ACADEMIC')];
router.get('/academic-years/:id/calendar', ...calendarStaff, async (req, res, next) => {
  try { res.json({ success: true, data: await getYearCalendar(positiveId(req.params.id)) }); }
  catch (error) { next(error); }
});
router.put('/academic-years/:id/calendar', ...calendarStaff, async (req, res, next) => {
  try { res.json({ success: true, data: await updateYearCalendar(positiveId(req.params.id), req.body, req.user!.userId) }); }
  catch (error) { next(error); }
});
// Scope authentication to these paths so sibling APIs retain their own role rules.
for (const resource of Object.keys(resources) as Resource[]) {
  router.get(`/${resource}`, authenticate, (resource === 'academic-periods' ? authorizeRoles('ADMIN','ACADEMIC','OJT_COORD') : authorizeRoles('ADMIN','ACADEMIC')), async (req,res,next) => {
    try { res.json({ success: true, ...await listRecords(resource, req.query as Record<string, unknown>,req.user!.roleCode!=='OJT_COORD') }); }
    catch (error) { next(error); }
  });
  router.post(`/${resource}`, authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
    try {
      const data = resource === 'academic-years'
        ? await createYearCalendar(req.body, req.user!.userId)
        : resource === 'academic-periods'
          ? await savePeriodResource(req.body, { userId: req.user!.userId, roleCode: req.user!.roleCode! })
          : await saveResource(resource, req.body, req.user!.userId);
      res.status(201).json({ success: true, data });
    }
    catch (error) { next(error); }
  });
  // Semester dates are updated only through the year-calendar transaction.
  if (resource !== 'academic-periods') router.patch(`/${resource}/:id`, authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
    try { res.json({ success: true, data: await saveResource(resource, req.body, req.user!.userId, positiveId(req.params.id)) }); }
    catch (error) { next(error); }
  });
}
export default router;
