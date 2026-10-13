const fs = require('node:fs');
const path = require('node:path');
fs.cpSync(path.join(__dirname, '../src/assets'), path.join(__dirname, '../dist/assets'), { recursive: true });
