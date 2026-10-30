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
  || [
    'frontend/src/config/menus/studentMenu.tsx','frontend/src/routers/PublicRouter.tsx',
    'frontend/src/services/studentApi.ts','frontend/src/services/studentService.ts',
    'frontend/src/contexts/StudentPortalContext.tsx','frontend/src/hooks/useStudentResource.ts',
    'frontend/src/layouts/StudentLayout.tsx','frontend/docs/student-api-integration.md',
    'frontend/scripts/check-student-scope.cjs','frontend/scripts/check-student-axios-browser.cjs',
  ].includes(file);
for (const file of [...existing,...added]) assert.ok(allowed(file),'Out-of-scope change: '+file);
const routerPath = 'frontend/src/routers/PublicRouter.tsx';
const before = git(['show','HEAD:'+routerPath]).replace(/\r\n/g,'\n');
const after = fs.readFileSync(path.join(root,routerPath),'utf8').trim().replace(/\r\n/g,'\n');
const marker = 'export const router = createBrowserRouter([';
assert.ok(before.includes(marker)&&after.includes(marker));
assert.equal(after.slice(after.indexOf(marker)),before.slice(before.indexOf(marker)),'Non-student route definitions must stay unchanged');
const api = fs.readFileSync(path.join(root,'frontend/src/services/studentApi.ts'),'utf8');
assert.ok(!/educationReadCache|from ['"]\.\/api['"]/.test(api),'Student requests must not alter the shared API/cache');
console.log(JSON.stringify({passed:true,trackedStudentChanges:existing.length,newStudentFiles:added.length,backendChanges:0,otherRoleChanges:0,nonStudentRoutes:'unchanged'}));
