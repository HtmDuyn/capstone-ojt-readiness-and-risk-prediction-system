import { Router, type RequestHandler } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { authorizeRoles } from '../../middleware/authorize';
import { listRules,saveRule } from './eligibility.service';
import { listOjtEligibilityResults } from './frontend-results.service';
import { runManualOjtAssessment } from './automatic-assessment.service';
import { invalid } from '../students/student.validation';
import { requireJsonBody } from '../../middleware/json-body';
import { currentOjtPolicy, previewOjtPolicy, publishOjtPolicy, listOjtConditions, createOjtCondition } from './ojt-policy.service';
const router=Router(),staff=[authenticate,authorizeRoles('ADMIN','ACADEMIC')];
const handle=(work:(req:any)=>Promise<unknown>,code=200):RequestHandler=>async(req,res,next)=>{try{res.status(code).json({success:true,data:await work(req)});}catch(error){next(error);}};
router.get('/ojt-eligibility-results',...staff,handle(req=>listOjtEligibilityResults(req.query)));
router.post('/ojt-eligibility-results',...staff,requireJsonBody,handle(req=>{
  if (!req.body || typeof req.body !== 'object' || Array.isArray(req.body) || Object.keys(req.body).length)
    throw invalid('Không cần gửi kết quả xét; hệ thống tự đọc dữ liệu học vụ hiện tại.');
  return runManualOjtAssessment(req.user.userId);
}));
router.get('/ojt-rule-sets',...staff,handle(req=>listRules(req.query)));
router.post('/ojt-rule-sets',...staff,handle(req=>saveRule(req.body,req.user.userId),201));
router.get('/ojt-condition-policy',...staff,handle(async()=>currentOjtPolicy()));
router.get('/ojt-conditions',...staff,handle(listOjtConditions));
router.post('/ojt-conditions',...staff,requireJsonBody,handle(req=>createOjtCondition(req.body,req.user.userId),201));
router.post('/ojt-condition-policy/preview',...staff,requireJsonBody,handle(req=>previewOjtPolicy(req.body)));
router.post('/ojt-condition-policy',...staff,requireJsonBody,handle(req=>publishOjtPolicy(req.body,req.user.userId),201));
export default router;
