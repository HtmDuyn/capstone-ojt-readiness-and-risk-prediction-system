// Guard the frontend-only student scope requested for this branch.
const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../..');
const git = args => cp.execFileSync('git', args, {cwd:root,encoding:'utf8'}).trim();
const existing = git(['diff','--name-only','HEAD']).split('\n').filter(Boolean);
const added = git(['ls-files','--others','--exclude-standard']).split('\n').filter(Boolean);
const allowed = file => file.startsWith('frontend/src/pages/student/')
  || file.startsWith('frontend/src/components/student/')
  || file.startsWith('frontend/src/types/student/')
  || ['frontend/src/data/student/mockStudentData.ts', 'frontend/src/data/student/mockAcademicProfileData.ts'].includes(file)
  || [
    'frontend/src/config/menus/studentMenu.tsx','frontend/src/routers/PublicRouter.tsx',
    'frontend/src/services/studentApi.ts','frontend/src/services/studentService.ts',
    'frontend/src/contexts/StudentPortalContext.tsx','frontend/src/hooks/useStudentResource.ts',
    'frontend/src/layouts/StudentLayout.tsx','frontend/docs/student-api-integration.md',
    'frontend/src/layouts/BaseLayout.tsx', 'frontend/src/components/common/AIConsultModal.tsx',
    'frontend/scripts/check-student-scope.cjs','frontend/scripts/check-student-axios-browser.cjs',
  ].includes(file);
for (const file of [...existing,...added]) assert.ok(allowed(file),'Out-of-scope change: '+file);
const routerPath = 'frontend/src/routers/PublicRouter.tsx';
const before = git(['show','HEAD:'+routerPath]).replace(/\r\n/g,'\n');
const after = fs.readFileSync(path.join(root,routerPath),'utf8').trim().replace(/\r\n/g,'\n');
const marker = 'export const router = createBrowserRouter([';
assert.ok(before.includes(marker)&&after.includes(marker));
assert.equal(after.slice(after.indexOf(marker)),before.slice(before.indexOf(marker)),'Non-student route definitions must stay unchanged');
const api = fs.readFileSync(path.join(root,'frontend/src/services/studentService.ts'),'utf8');
assert.ok(!/educationReadCache|from ['"]\.\/api['"]/.test(api),'Student requests must not alter the shared API/cache');
const scan = directory => fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
  const file = path.join(directory, entry.name);
  return entry.isDirectory() ? scan(file) : /\.(ts|tsx)$/.test(file) ? [file] : [];
});
for (const file of [
  ...scan(path.join(root, 'frontend/src/pages/student')),
  ...scan(path.join(root, 'frontend/src/components/student')),
  path.join(root, 'frontend/src/layouts/BaseLayout.tsx'),
]) {
  assert.ok(!/mockStudent|mockAcademic|@\/data\/student\//.test(fs.readFileSync(file, 'utf8')), 'Student mock data dependency: ' + file);
}
for (const file of ['mockStudentData.ts', 'mockAcademicProfileData.ts']) {
  assert.ok(!fs.existsSync(path.join(root, 'frontend/src/data/student', file)), 'Remove student mock dataset: ' + file);
}
console.log(JSON.stringify({passed:true,trackedStudentChanges:existing.length,newStudentFiles:added.length,backendChanges:0,sharedMockCleanup:existing.filter(file=>['frontend/src/layouts/BaseLayout.tsx','frontend/src/components/common/AIConsultModal.tsx'].includes(file)).length,studentMockDatasets:0,nonStudentRoutes:'unchanged'}));
