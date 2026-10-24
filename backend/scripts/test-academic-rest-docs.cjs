const assert=require('node:assert/strict');
const {swaggerSpec:spec}=require('../dist/config/swagger');
const academic=(path,method)=>spec.paths['/api'+path]?.[method]?.tags?.includes('Phòng đào tạo');
for(const [path,method] of [
 ['/academic/dashboard','get'],['/academic/alerts','get'],['/academic/course-demand','get'],
 ['/academic-periods/{id}/combo-phase-schedules','get'],['/academic-periods/{id}/combo-phase-schedules','put'],
 ['/academic-periods/{id}/ojt-advisory-schedule','put'],['/ojt-semesters/{id}/assessment-window','put'],
 ['/ojt-semesters/{id}/assessment-window/open','post'],['/ojt-semesters/{id}/assessment-window/close','post'],
 ['/imports/preview','post'],['/curriculum-imports/preview','post'],['/ojt-rule-sets/{id}/publish','post'],
 ['/academic/academic-summary-notifications','post'],['/academic/eligibility-notifications','post'],
 ['/students/{id}/course-results','get'],['/combo-registration-windows/{id}/selections','get'],
])assert(!academic(path,method),`${method} ${path} still appears in academic group`);
for(const [path,methods]of Object.entries({
 '/assessment-windows':['get','post','patch'],'/ojt-rule-sets':['patch'],
 '/student-imports':['get','post','patch'],'/curriculum-imports':['get','post','patch'],
 '/academic-notifications':['get','post'],'/eligible-student-handoffs':['get','post'],
 '/ojt-semesters':['get'],'/ojt-semesters/{id}':['get'],'/combo-registration-windows/{id}':['get']
}))for(const method of methods)assert(academic(path,method),`Missing ${method} ${path}`);
for(const path of ['/academic-years','/academic-periods','/cohorts']){
 assert.equal(spec.paths['/api'+path].get.requestBody,undefined);
 assert.deepEqual(spec.paths['/api'+path].get.parameters,[]);
}
assert(spec.paths['/api/imports/preview'].post.tags.includes('Phòng QHDN'));
assert(spec.paths['/api/students/{id}/course-results'].get.tags.includes('Sinh viên'));
for(const item of Object.values(spec.paths))for(const [method,op]of Object.entries(item))if(method==='get')assert(!op.requestBody);
console.log('Academic REST Swagger checks passed: retired operations hidden, replacements present, shared roles preserved, GET has no body.');
