const test = require('node:test');
const assert = require('node:assert/strict');
const { swaggerSpec: spec } = require('../dist/config/swagger');

test('final Swagger describes actual coordination and resubmission bodies while retaining the 32 QHDN APIs', () => {
  const schema = (url, method) => spec.paths[url][method].requestBody.content['application/json'].schema;
  const create = schema('/api/ojt-coordinations', 'post');
  assert.deepEqual(create.required, ['registrationId', 'positionId', 'reason', 'idempotencyKey']);
  assert.equal(create.anyOf, undefined);
  const reassign = schema('/api/ojt-coordinations/{id}/reassign', 'post');
  assert.deepEqual(reassign.required, ['positionId', 'reason', 'idempotencyKey']);
  assert.equal(reassign.properties.applicationId, undefined);
  assert.ok(!spec.paths['/api/ojt-coordinations'].get.parameters.some(p => p.name === 'applicationId'));
  assert.ok(!spec.paths['/api/qhdn/registered-students'].get.parameters.some(p => p.name === 'registrationStatus'));
  assert.ok(schema('/api/ojt-results', 'post').properties.expectedVersion);
  assert.deepEqual(schema('/api/ojt-results/{id}/confirm', 'post').required, ['reason', 'idempotencyKey']);
  assert.deepEqual(spec.paths['/api/enterprise/candidates/{id}/cv'].get['x-roles'], ['ENTERPRISE']);
  for (const method of ['get', 'post']) assert.deepEqual(spec.paths['/api/students/me/cv-analysis'][method]['x-roles'], ['STUDENT']);
  let qhdn = 0;
  for (const item of Object.values(spec.paths)) for (const method of ['get', 'post', 'put', 'patch', 'delete']) if (item[method]?.['x-roles']?.includes('OJT_COORD')) qhdn++;
  assert.equal(qhdn + 1, 32, 'Include public login once; adjacent-role fixes do not grant new QHDN rights');
});
