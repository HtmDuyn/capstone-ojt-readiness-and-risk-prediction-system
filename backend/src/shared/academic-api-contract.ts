import type { RequestHandler } from 'express';
// Shared by request validation and final OpenAPI contract validation.
export const academicOperations:Record<string,string[]> = {
  '/assessment-windows':['get','post','patch'],
  '/ojt-semesters':['get'], '/ojt-semesters/{id}':['get'],
  '/ojt-grade-mappings':['put'], '/eligible-student-handoffs':['get','post'],
  '/academic-notifications':['get','post'],
  '/student-imports':['get','post','patch'], '/student-imports/{id}':['get'],
  '/curriculum-imports':['get','post','patch'], '/curriculum-imports/{id}':['get'],
  '/academic-alerts':['get'], '/course-demands':['get'], '/course-demands/export':['get'],
  '/combo-registration-windows/{id}/selections':['post'],
  '/academic-years':['get','post','patch'],
  '/academic-periods':['get','post','patch'],
  '/cohorts':['get','post','patch'],
  '/ojt-registration-windows/{id}/semester-exceptions':['post'],
  '/ojt-registration-windows/{id}/semester-exceptions/{exceptionId}/revoke':['post'],
  '/combo-registration-windows/{id}/preview':['post'],
  '/accounts/me/profile':['patch'],
  '/combo-registration-windows':['get','post'], '/combo-registration-windows/{id}':['get','patch'],
  '/combo-registration-windows/{id}/extensions':['post'],
  '/combo-registration-windows/{id}/reminders':['post'],
  '/combo-registration-windows/{id}/finalize':['post'],
  '/majors':['get','post'], '/courses':['get','post'], '/courses/{id}':['patch'],
  '/curricula':['get'], '/curricula/{id}':['get'],
  '/ojt-rule-sets':['get','post','patch'],
  '/eligibility-check-runs':['post'],
  '/ojt-semesters/{id}/students':['get'],
  '/students':['get'], '/students/{id}':['get','patch'],
  '/course-results/{id}':['patch'], '/academic-imports':['get'], '/ojt-results':['get'],
  '/ojt-semesters/{id}/results/export':['get'],
  '/students/{id}/cv':['get'], '/ojt-results/{id}/confirm':['post'],
};
const matchers=Object.entries(academicOperations).map(([path,methods])=>({
  pattern:new RegExp('^'+path.replace(/\{[^}]+\}/g,'[^/]+')+'/?$'),methods,
}));
export const academicJsonRequests:RequestHandler=(req,res,next)=>{
  const method=req.method.toLowerCase();
  if(!['post','put','patch'].includes(method)||!matchers.some(m=>m.methods.includes(method)&&m.pattern.test(req.path)))return next();
  if(Object.keys(req.query).length){res.status(400).json({success:false,errorCode:'JSON_BODY_REQUIRED',message:'Send input fields in the JSON request body, not query parameters.'});return;}
  const hasBody=Number(req.headers['content-length']??0)>0||req.headers['transfer-encoding']!==undefined;
  if(hasBody&&!req.is('application/json')){res.status(415).json({success:false,errorCode:'JSON_CONTENT_TYPE_REQUIRED',message:'Use Content-Type: application/json.'});return;}
  next();
};
