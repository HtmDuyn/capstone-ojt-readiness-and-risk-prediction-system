import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { listRecords, resources, type Resource } from './academic.repository';
import { saveResource } from './academic.service';
import { inputObject,positiveId } from './academic.schema';
import { savePeriodResource } from './period-resource.service';

const router = Router();
for(const resource of Object.keys(resources) as Resource[])router.patch(`/${resource}`,authenticate,authorizeRoles('ADMIN','ACADEMIC'),async(req,res,next)=>{
  try {
    const input=inputObject(req.body,['id',...Object.keys(resources[resource].fields),...(resource==='academic-periods'?['ojt','comboPhaseSchedules','advisorySchedule']:resource==='cohorts'?['groups']:[])]);
    const {id:rawId,...changes}=input,id=positiveId(rawId);
    res.json({success:true,data:resource==='academic-periods'?await savePeriodResource(changes,{userId:req.user!.userId,roleCode:req.user!.roleCode!},id):await saveResource(resource,changes,req.user!.userId,id)});
  }catch(error){next(error);}
});
// Scope authentication to these paths so sibling APIs retain their own role rules.
for (const resource of Object.keys(resources) as Resource[]) {
  router.get(`/${resource}`, authenticate, (resource === 'academic-periods' ? authorizeRoles('ADMIN','ACADEMIC','OJT_COORD') : authorizeRoles('ADMIN','ACADEMIC')), async (req,res,next) => {
    try { res.json({ success: true, ...await listRecords(resource, req.query as Record<string, unknown>,req.user!.roleCode!=='OJT_COORD') }); }
    catch (error) { next(error); }
  });
  router.post(`/${resource}`, authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
    try { res.status(201).json({ success: true, data: resource==='academic-periods'?await savePeriodResource(req.body,{userId:req.user!.userId,roleCode:req.user!.roleCode!}):await saveResource(resource, req.body, req.user!.userId) }); }
    catch (error) { next(error); }
  });
  router.patch(`/${resource}/:id`, authenticate, authorizeRoles('ADMIN','ACADEMIC'), async (req,res,next) => {
    try { res.json({ success: true, data: await saveResource(resource, req.body, req.user!.userId, positiveId(req.params.id)) }); }
    catch (error) { next(error); }
  });
}
export default router;
