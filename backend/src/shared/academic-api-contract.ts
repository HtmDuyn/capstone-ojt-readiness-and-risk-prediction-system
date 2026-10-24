import type { RequestHandler } from 'express';

// Shared by request validation, OpenAPI and the academic contract regression test.
export const academicOperations:Record<string,string[]> = {
  '/academic-years':['get','post','patch'],
  '/academic-periods':['get','post','patch'],
  '/cohorts':['get','post','patch'],
  '/academic-periods/{id}/combo-phase-schedules':['get','put'],
  '/ojt-semesters/{id}/assessment-window':['get','put'],
  '/ojt-semesters/{id}/assessment-window/open':['post'],
  '/ojt-semesters/{id}/assessment-window/close':['post'],
  '/curricula/{id}/ojt-grade-mappings/{semesterId}':['get','put'],
  '/ojt-registration-windows/{id}/semester-exceptions':['post'],
  '/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke':['post'],
  '/combo-registration-windows/{id}/preview':['post'],
  '/academic/dashboard':['get'], '/academic/alerts':['get'],
  '/academic/course-demand':['get'], '/academic/course-demand/export':['get'],
  '/academic/alerts/notifications':['post'], '/accounts/me/profile':['patch'],
  '/combo-registration-windows':['get','post'], '/combo-registration-windows/{id}':['patch'],
  '/combo-registration-windows/{id}/extensions':['post'],
  '/combo-registration-windows/{id}/selections':['get','post'],
  '/combo-registration-windows/{id}/reminders':['post'],
  '/students/{id}/combo-selections':['get'], '/combo-registration-windows/{id}/finalize':['post'],
  '/majors':['get','post'], '/courses':['get','post'], '/courses/{id}':['patch'],
  '/curricula':['get'], '/curricula/{id}':['get'],
  '/curriculum-imports/preview':['post'], '/curriculum-imports/commit':['post'],
  '/ojt-rule-sets':['get','post'], '/ojt-rule-sets/{id}':['patch'], '/ojt-rule-sets/{id}/publish':['post'],
  '/students/{id}/eligibility-checks':['get'], '/students/{id}/eligibility':['get'],
  '/eligibility-check-runs':['post'], '/imports/preview':['post'], '/imports/commit':['post'],
  '/ojt-semesters/{id}/eligible-student-handoffs':['get','post'], '/ojt-semesters/{id}/students':['get'],
  '/students':['get'], '/students/{id}':['get','patch'], '/students/{id}/course-results':['get'],
  '/course-results/{id}':['patch'], '/academic-imports':['get'], '/ojt-results':['get'],
  '/ojt-semesters/{id}/results/export':['get'],
  '/academic/academic-summary-notifications':['post'], '/academic/eligibility-notifications':['post'],
  '/academic-periods/{id}/ojt-advisory-schedule':['get','put'],
  '/academic/advisory-runs':['get'], '/academic/advisory-runs/{id}':['get'],
  '/students/{id}/cv':['get'], '/ojt-results/{id}/confirm':['post'],
};
const matchers=Object.entries(academicOperations).map(([path,methods])=>({
  pattern:new RegExp('^'+path.replace(/\{[^}]+\}/g,'[^/]+')+'/?$'),methods,
}));
// Retain validation for the legacy URL while clients migrate to the JSON-body endpoint.
matchers.push({pattern:/^\/(academic-years|academic-periods|cohorts)\/[^/]+\/?$/,methods:['patch']});
export const academicJsonRequests:RequestHandler=(req,res,next)=>{
  const method=req.method.toLowerCase();
  if(!['post','put','patch'].includes(method)||!matchers.some(m=>m.methods.includes(method)&&m.pattern.test(req.path)))return next();
  if(Object.keys(req.query).length){res.status(400).json({success:false,errorCode:'JSON_BODY_REQUIRED',message:'Send input fields in the JSON request body, not query parameters.'});return;}
  const hasBody=Number(req.headers['content-length']??0)>0||req.headers['transfer-encoding']!==undefined;
  if(hasBody&&!req.is('application/json')){res.status(415).json({success:false,errorCode:'JSON_CONTENT_TYPE_REQUIRED',message:'Use Content-Type: application/json.'});return;}
  next();
};
