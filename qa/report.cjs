const fs = require('node:fs');
const path = require('node:path');
const { spawnSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const venvPython = path.join(root, '.venv', process.platform === 'win32' ? 'Scripts/python.exe' : 'bin/python');
const verify = process.argv.includes('--verify');
const result = spawnSync(fs.existsSync(venvPython) ? venvPython : 'python', [
  path.join(__dirname, verify ? 'verify_reports.py' : 'export_reports.py'),
  ...process.argv.slice(2).filter(arg => arg !== '--verify'),
], { cwd: root, env: { ...process.env, PYTHONIOENCODING: 'utf-8' }, stdio: 'inherit', windowsHide: true });
if (result.error) console.error('QA report process error:', result.error.code);
process.exitCode = result.status ?? 1;
