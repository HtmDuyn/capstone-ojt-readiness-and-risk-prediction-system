const {test}=require('node:test');
const assert=require('node:assert/strict');

// Load the complete Swagger pipeline used by the docs routes, including the role
// coverage check. This catches new routes missing from the role registry.
const {swaggerSpec}=require('../dist/config/swagger');

test('Swagger initializes and QHDN schedule actions have the same access as their routes',()=>{
 for(const [path,method] of [
  ['/api/recruitment/windows/{id}/schedule','patch'],
  ['/api/recruitment/windows/{id}','delete'],
 ]){
  const operation=swaggerSpec.paths[path][method];
  assert.deepEqual(operation['x-roles'],['OJT_COORD']);
  assert.deepEqual(operation.tags,['Phòng QHDN']);
  assert.ok(operation.security.length);
 }
});
test('enterprise bulk preview and confirmation are registered under the enterprise role',()=>{
 for(const path of ['/api/enterprise/candidates/acceptance-preview','/api/enterprise/candidates/accept-bulk','/api/enterprise/internships/evaluations/bulk']){
  assert.deepEqual(swaggerSpec.paths[path].post['x-roles'],['ENTERPRISE']);
 }
});

test('OJT results retain Education read access and remove the old transfer and confirmation operations',()=>{
 assert.ok(swaggerSpec.paths['/api/ojt-results'].get['x-roles'].includes('ACADEMIC'));
 assert.ok(swaggerSpec.paths['/api/ojt-semesters/{id}/results/export'].get['x-roles'].includes('ACADEMIC'));
 assert.equal(swaggerSpec.paths['/api/ojt-results'].post,undefined);
 assert.equal(swaggerSpec.paths['/api/ojt-results/{id}/confirm'],undefined);
 assert.deepEqual(swaggerSpec.paths['/api/ojt-results/publish'].post['x-roles'],['ADMIN','OJT_COORD']);
});
test('enterprise profile documents intake and completed student counts',()=>{
 const response=swaggerSpec.paths['/api/enterprise/profile'].get.responses['200'].content['application/json'].schema;
 const summary=response.properties.data.properties.summary;
 assert.equal(summary.properties.acceptedInterns.type,'integer');
 assert.equal(summary.properties.completedInterns.type,'integer');
});
test('OJT result publication is documented for QHDN and supports semester-wide publishing',()=>{
 const operation=swaggerSpec.paths['/api/ojt-results/publish'].post;
 assert.deepEqual(operation['x-roles'],['ADMIN','OJT_COORD']);
 const request=operation.requestBody.content['application/json'].schema;
 assert.ok(request.required.includes('ojtSemesterId'));
 assert.equal(request.properties.evaluationIds.maxItems,500);
 assert.ok(operation.responses['202']);
});
