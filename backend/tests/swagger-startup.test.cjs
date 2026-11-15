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
