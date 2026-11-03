const path = require('node:path');
const fs = require('node:fs');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const assert = require('node:assert/strict');
const backend = path.resolve(__dirname, '..');
const repo = path.dirname(backend);
const cache = path.join(backend, '.local/student-contract-baseline');
const changedFiles = execFileSync('git', ['diff','--name-only','HEAD'], { cwd: repo, encoding: 'utf8' }).trim().split('\n').filter(Boolean);
changedFiles.push(...execFileSync('git', ['ls-files','--others','--exclude-standard'], { cwd: repo, encoding: 'utf8' }).trim().split('\n').filter(Boolean));
const allowed = file => file.startsWith('backend/src/modules/student-portal/') || file.startsWith('backend/docs/') || file.startsWith('backend/scripts/') || file.startsWith('backend/tests/') || [
  'backend/src/modules/auth/auth.controller.ts', 'backend/src/modules/students/job-application.service.ts',
  'backend/src/modules/students/registration-options.service.ts', 'backend/src/modules/ojt-registration/registration.service.ts',
  'backend/src/config/swagger.ts', 'backend/src/config/swagger-role-groups.ts',
  'backend/DB',
].includes(file);
for (const file of changedFiles) assert.ok(allowed(file), 'Out-of-scope change: ' + file);
const head = file => execFileSync('git', ['show','HEAD:' + file], { cwd: repo, encoding: 'utf8' }).replace(/\r\n/g,'\n');
const current = file => fs.readFileSync(path.join(repo, file), 'utf8').replace(/\r\n/g,'\n');
const databaseFile = current('backend/DB');
assert.equal(databaseFile.replace(/\n-- BEGIN STUDENT DATABASE AUDIT \(READ ONLY\)[\s\S]*?-- END STUDENT DATABASE AUDIT \(READ ONLY\)\n/, ''),
  head('backend/DB'), 'Existing database schema, routines and seed data must stay unchanged');
const registrationFile = 'backend/src/modules/ojt-registration/registration.service.ts';
assert.equal(current(registrationFile)
  .replace("import { requireStudentAdmission } from '../student-portal/admission.service';\n", '')
  .replace(" if(actor.roleCode==='STUDENT')await requireStudentAdmission(c,studentId,w.OJTSemesterID);\n", ''), head(registrationFile), 'Non-student registration code changed');
const authFile = 'backend/src/modules/auth/auth.controller.ts';
assert.equal(current(authFile).replace("        ...(user.role_code === 'STUDENT' ? { studentId: user.studentId } : {}),\n", ''), head(authFile), 'Non-student auth code changed');
const applicationFile = 'backend/src/modules/students/job-application.service.ts';
const listApplications = source => source.slice(source.indexOf('export async function listApplications'), source.indexOf('export async function studentOpportunities'));
assert.equal(listApplications(current(applicationFile)), listApplications(head(applicationFile)), 'Shared application-list behavior changed');
const files = execFileSync('git', ['ls-tree','-r','--name-only','HEAD','backend/src'], { cwd: repo, encoding: 'utf8' }).trim().split('\n');
const queries = files.map(file => 'HEAD:' + file).join('\n') + '\n';
const objects = execFileSync('git', ['cat-file','--batch'], { cwd: repo, input: queries, maxBuffer: 40 * 1024 * 1024 });
let position = 0;
for (const file of files) {
  const newline = objects.indexOf(10, position);
  const header = objects.subarray(position, newline).toString().split(' ');
  const size = Number(header[2]);
  if (!Number.isFinite(size)) throw Error('Cannot read source baseline: ' + file);
  const content = objects.subarray(newline + 1, newline + 1 + size);
  position = newline + 1 + size + 1;
  const relative = file.slice('backend/src/'.length);
  if (relative.endsWith('.d.ts')) continue;
  const target = path.join(cache, relative.replace(/\.ts$/, '.js'));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, relative.endsWith('.ts') ? ts.transpileModule(content.toString('utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText : content);
}
const before = require(path.join(cache, 'config/swagger.js')).swaggerSpec;
const after = require(path.join(backend, 'dist/config/swagger.js')).swaggerSpec;
let checked = 0;
const schemas = new Set();
function references(value) {
  if (!value || typeof value !== 'object') return;
  if (value.$ref?.startsWith('#/components/schemas/')) {
    const name = value.$ref.slice('#/components/schemas/'.length);
    if (!schemas.has(name)) { schemas.add(name); references(before.components.schemas[name]); }
  }
  for (const item of Object.values(value)) references(item);
}
for (const [url, item] of Object.entries(before.paths)) {
  for (const method of ['get','post','put','patch','delete']) {
    const operation = item[method];
    if (!operation?.['x-roles']?.some(role => role !== 'STUDENT')) continue;
    assert.deepEqual(after.paths[url]?.[method], operation, 'Other-role API changed: ' + method.toUpperCase() + ' ' + url);
    references(operation);
    checked++;
  }
}
for (const name of schemas) assert.deepEqual(after.components.schemas[name], before.components.schemas[name], 'Shared response schema changed: ' + name);
console.log(JSON.stringify({ passed: true, otherRoleOperationsChecked: checked, referencedSchemasChecked: schemas.size, changed: 0 }));
