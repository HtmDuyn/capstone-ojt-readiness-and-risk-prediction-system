const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { spawnSync, execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const live = process.argv.includes('--live');
const browser = process.argv.includes('--browser');
const runId = new Date().toISOString().replace(/[:.]/g, '-') + (live ? '-live' : '-unit');
const output = path.join(__dirname, 'results', runId);
fs.mkdirSync(output, { recursive: true });
const env = { ...process.env, QA_RESULTS_DIR: output, QA_RUN_ID: runId, TZ: 'Asia/Ho_Chi_Minh', PYTHONIOENCODING: 'utf-8' };
const manifest = { runId, startedAt: new Date().toISOString(), timezone: 'Asia/Ho_Chi_Minh', node: process.version, live, browser, steps: [], sourceHash: '', gitHead: '', dirty: true };
try {
  manifest.gitHead = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
  manifest.dirty = !!execFileSync('git', ['status', '--porcelain'], { cwd: root, encoding: 'utf8' }).trim();
} catch {}
const hash = crypto.createHash('sha256');
function fingerprint(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) fingerprint(full);
    else { hash.update(path.relative(root, full).replaceAll('\\', '/')); hash.update(fs.readFileSync(full)); }
  }
}
for (const dir of ['backend/src', 'frontend/src']) fingerprint(path.join(root, dir));
hash.update(fs.readFileSync(path.join(root, 'backend/DB')));
manifest.sourceHash = hash.digest('hex');
function save() {
  fs.writeFileSync(path.join(output, 'run.json'), JSON.stringify(manifest, null, 2));
  fs.writeFileSync(path.join(__dirname, 'results/latest.json'), JSON.stringify({ runId, directory: output }, null, 2));
}
save();
function command(name, executable, args, cwd) {
  const start = new Date();
  console.log(`\n[QA] ${name}`);
  const result = spawnSync(executable, args, { cwd, env, encoding: 'utf8', windowsHide: true, maxBuffer: 20 * 1024 * 1024 });
  const log = (result.stdout || '') + (result.stderr || '');
  fs.writeFileSync(path.join(output, name + '.log'), log);
  // Print a compact tail; detailed evidence stays in the run directory.
  console.log(log.split(/\r?\n/).slice(-18).join('\n'));
  const code = result.status ?? 1;
  manifest.steps.push({ name, command: [executable, ...args], exitCode: code, startedAt: start.toISOString(), endedAt: new Date().toISOString(), error: result.error?.code || null });
  save(); return code;
}
function npm(name, dir, script) {
  return process.platform === 'win32'
    ? command(name, process.env.ComSpec || 'cmd.exe', ['/d', '/s', '/c', `npm.cmd run ${script}`], path.join(root, dir))
    : command(name, 'npm', ['run', script], path.join(root, dir));
}
const codes = [];
codes.push(npm('backend-build', 'backend', 'build'));
codes.push(npm('frontend-build', 'frontend', 'build'));
codes.push(npm('backend-unit', 'backend', 'test:coverage'));
codes.push(npm('frontend-unit', 'frontend', 'test:coverage'));
if (live) codes.push(npm('live-api', 'backend', 'test:live'));
if (browser) codes.push(npm('browser', 'frontend', 'test:e2e'));
manifest.endedAt = new Date().toISOString(); save();
const venvPython = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const python = fs.existsSync(venvPython) ? venvPython : 'python';
codes.push(command('export-reports', python, [path.join(__dirname, 'export_reports.py'), '--results', output], root));
codes.push(command('verify-reports', python, [path.join(__dirname, 'verify_reports.py'), '--results', output], root));
console.log(`\nQA evidence: ${output}`);
console.log('Excel reports: qa/reports');
process.exitCode = codes.some(code => code !== 0) ? 1 : 0;
