const {test}=require('node:test');
const assert=require('node:assert/strict');

// Load the complete Swagger pipeline used during startup, including the role
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
 for(const path of ['/api/enterprise/candidates/acceptance-preview','/api/enterprise/candidates/accept-bulk']){
  assert.deepEqual(swaggerSpec.paths[path].post['x-roles'],['ENTERPRISE']);
 }
});
test('enterprise profile documents intake and completed student counts',()=>{
 const response=swaggerSpec.paths['/api/enterprise/profile'].get.responses['200'].content['application/json'].schema;
 const summary=response.properties.data.properties.summary;
 assert.equal(summary.properties.acceptedInterns.type,'integer');
 assert.equal(summary.properties.completedInterns.type,'integer');
});
