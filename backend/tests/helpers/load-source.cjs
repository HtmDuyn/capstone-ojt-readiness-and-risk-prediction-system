const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
const root = path.resolve(__dirname, '../..');

// Compile in memory without loading .env, generating dist, or using a real DB.
module.exports = function loadSource(file, dependencies = {}, source) {
  const filename = path.resolve(root, file);
  const output = ts.transpileModule(source ?? fs.readFileSync(filename, 'utf8'), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, esModuleInterop: true },
  }).outputText;
  const module = { exports: {} };
  const localRequire = name => {
    if (Object.hasOwn(dependencies, name)) return dependencies[name];
    if (name.startsWith('.')) {
      const target = path.resolve(path.dirname(filename), name);
      if (fs.existsSync(target + '.ts')) return require('./load-source.cjs')(target + '.ts');
    }
    return require(require.resolve(name, { paths: [path.dirname(filename)] }));
  };
  new Function('require', 'module', 'exports', output)(localRequire, module, module.exports);
  return module.exports;
};
