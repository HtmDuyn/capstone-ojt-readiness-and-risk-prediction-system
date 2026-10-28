const fs = require('node:fs');
const path = require('node:path');

// tsc does not remove output for deleted source files. Old OpenAPI modules in
// dist are still discovered at startup and can prevent the new backend booting.
const backendRoot = fs.realpathSync(path.resolve(__dirname, '..'));
const output = path.resolve(backendRoot, 'dist');
if (path.dirname(output) !== backendRoot || path.basename(output) !== 'dist') {
  throw new Error('Refusing to clean a directory outside backend/dist.');
}
fs.rmSync(output, { recursive: true, force: true });
